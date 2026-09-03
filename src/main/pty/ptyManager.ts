import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import os from 'node:os'
import type * as PtyModule from 'node-pty'
import type { PtySpawnOptions, SessionSnapshot, SessionStatus } from '../../shared/types'

interface TrackedSession {
  snapshot: SessionSnapshot
  proc: PtyModule.IPty
  activityTimer: NodeJS.Timeout | null
}

// node-pty ships a native addon (pty.node) that must match this Electron
// build's ABI. A mismatch, a missing prebuild for the current platform, or
// a rebuild that never ran throws the moment the module is evaluated — and
// since that used to happen via a top-level `import`, it took the whole
// main process down before a single window could open. Loading it lazily,
// on first spawn, confines that failure to "this session failed to start"
// instead of an unrecoverable crash on app boot.
const requireNative = createRequire(import.meta.url)
let ptyModule: typeof PtyModule | null = null
let ptyLoadError: string | null = null

function loadPty(): typeof PtyModule | null {
  if (ptyModule || ptyLoadError) return ptyModule
  try {
    ptyModule = requireNative('node-pty')
  } catch (err) {
    ptyLoadError = err instanceof Error ? err.message : String(err)
  }
  return ptyModule
}

export interface PtyManagerEvents {
  onData: (sessionId: string, chunk: string) => void
  onExit: (sessionId: string, exitCode: number, signal?: number) => void
  onError: (sessionId: string, message: string) => void
  onStatus: (snapshot: SessionSnapshot) => void
}

const SHELL = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash'

/**
 * Owns every live `claude` PTY the app has spawned. One AgentProfile can have
 * at most one live session at a time; respawning kills the previous process.
 */
export class PtyManager {
  private sessions = new Map<string, TrackedSession>()
  private sessionsByAgent = new Map<string, string>()

  constructor(
    private readonly events: PtyManagerEvents,
    private readonly claudeBinary: () => string,
    private readonly activityWindowMs: () => number
  ) {}

  list(): SessionSnapshot[] {
    return [...this.sessions.values()].map((s) => s.snapshot)
  }

  spawn(opts: PtySpawnOptions): SessionSnapshot {
    const existingId = this.sessionsByAgent.get(opts.agentId)
    if (existingId) this.kill(existingId)

    const sessionId = randomUUID()
    const cwd = expandHome(opts.cwd) || os.homedir()

    const pty = loadPty()
    if (!pty) {
      return this.failedSpawn(
        sessionId,
        opts.agentId,
        `node-pty's native binding failed to load (${ptyLoadError}). Run ` +
          '"npx electron-builder install-app-deps" and restart the app.'
      )
    }

    let proc: PtyModule.IPty
    try {
      // Spawn through the user's login shell so PATH/nvm/asdf-managed
      // installs of the claude CLI resolve the same way they would in a
      // real terminal, then exec claude so the pty's only child is claude.
      const claude = this.claudeBinary()
      const shellArgs = buildShellExecArgs(claude, opts.args)
      proc = pty.spawn(SHELL, shellArgs, {
        name: 'xterm-256color',
        cols: opts.cols,
        rows: opts.rows,
        cwd,
        env: { ...process.env, TERM: 'xterm-256color' } as { [key: string]: string }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return this.failedSpawn(sessionId, opts.agentId, message)
    }

    const tracked: TrackedSession = {
      proc,
      activityTimer: null,
      snapshot: {
        sessionId,
        agentId: opts.agentId,
        status: 'active',
        startedAt: Date.now(),
        exitCode: null,
        errorMessage: null,
        bytesIn: 0,
        bytesOut: 0
      }
    }
    this.sessions.set(sessionId, tracked)
    this.sessionsByAgent.set(opts.agentId, sessionId)

    proc.onData((chunk) => {
      tracked.snapshot.bytesOut += chunk.length
      this.markActive(sessionId)
      this.events.onData(sessionId, chunk)
    })

    proc.onExit(({ exitCode, signal }) => {
      tracked.snapshot.status = 'exited'
      tracked.snapshot.exitCode = exitCode
      if (tracked.activityTimer) clearTimeout(tracked.activityTimer)
      this.sessionsByAgent.delete(opts.agentId)
      this.events.onExit(sessionId, exitCode, signal)
      this.events.onStatus(tracked.snapshot)
    })

    this.events.onStatus(tracked.snapshot)
    return tracked.snapshot
  }

  write(sessionId: string, data: string): void {
    const tracked = this.sessions.get(sessionId)
    if (!tracked || tracked.snapshot.status === 'exited') return
    tracked.snapshot.bytesIn += data.length
    tracked.proc.write(data)
    this.markActive(sessionId)
  }

  resize(sessionId: string, cols: number, rows: number): void {
    const tracked = this.sessions.get(sessionId)
    if (!tracked || tracked.snapshot.status === 'exited') return
    if (cols <= 0 || rows <= 0) return
    try {
      tracked.proc.resize(cols, rows)
    } catch {
      // Resizing a pty that just exited is a harmless race; ignore it.
    }
  }

  kill(sessionId: string): void {
    const tracked = this.sessions.get(sessionId)
    if (!tracked) return
    if (tracked.activityTimer) clearTimeout(tracked.activityTimer)
    try {
      tracked.proc.kill()
    } catch {
      // Already dead.
    }
    this.sessions.delete(sessionId)
    if (this.sessionsByAgent.get(tracked.snapshot.agentId) === sessionId) {
      this.sessionsByAgent.delete(tracked.snapshot.agentId)
    }
  }

  killAll(): void {
    for (const id of [...this.sessions.keys()]) this.kill(id)
  }

  private failedSpawn(sessionId: string, agentId: string, message: string): SessionSnapshot {
    const snapshot: SessionSnapshot = {
      sessionId,
      agentId,
      status: 'error',
      startedAt: null,
      exitCode: null,
      errorMessage: message,
      bytesIn: 0,
      bytesOut: 0
    }
    this.events.onError(sessionId, message)
    this.events.onStatus(snapshot)
    return snapshot
  }

  private markActive(sessionId: string): void {
    const tracked = this.sessions.get(sessionId)
    if (!tracked || tracked.snapshot.status === 'exited') return
    if (tracked.activityTimer) clearTimeout(tracked.activityTimer)
    if (tracked.snapshot.status !== 'active') {
      tracked.snapshot.status = 'active'
      this.events.onStatus(tracked.snapshot)
    }
    tracked.activityTimer = setTimeout(() => {
      if (tracked.snapshot.status === 'active') {
        tracked.snapshot.status = 'standby' as SessionStatus
        this.events.onStatus(tracked.snapshot)
      }
    }, this.activityWindowMs())
  }
}

function expandHome(p: string): string {
  if (p === '~') return os.homedir()
  if (p.startsWith('~/')) return `${os.homedir()}${p.slice(1)}`
  return p
}

/**
 * Builds argv for `$SHELL -lic "exec <claude> <args...>"`, quoting each
 * argument so paths and prompt text with spaces survive the shell
 * round-trip. `exec` replaces the login shell with claude once PATH/rc
 * resolution is done, so claude is the pty's direct child — it gets
 * SIGWINCH/Ctrl-C directly and its real exit code becomes the pty's.
 */
function buildShellExecArgs(claudeBinary: string, args: string[]): string[] {
  if (os.platform() === 'win32') {
    const cmd = [claudeBinary, ...args].map(psQuote).join(' ')
    return ['-NoLogo', '-NoProfile', '-Command', cmd]
  }
  const cmd = ['exec', claudeBinary, ...args].map(shQuote).join(' ')
  return ['-lic', cmd]
}

function shQuote(arg: string): string {
  return `'${arg.replace(/'/g, `'\\''`)}'`
}

function psQuote(arg: string): string {
  return `'${arg.replace(/'/g, "''")}'`
}
