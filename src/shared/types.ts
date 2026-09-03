/**
 * Types shared across the main process, preload bridge, and renderer.
 * Keep this file dependency-free (no Electron/Node imports) so it can be
 * imported from any of the three worlds without pulling in the wrong runtime.
 */

/** A role on the floor's roster. One role = one spawnable Claude Code session. */
export interface AgentProfile {
  id: string
  name: string
  role: string
  /** Short two-letter monogram shown on the roster chip and cost table. */
  mono: string
  /** Accent color for the avatar / status glow, as a hex string. */
  color: string
  /** Working directory the session is spawned in. */
  cwd: string
  /** Extra text appended to Claude Code's system prompt via --append-system-prompt. */
  systemPrompt: string
  /** Model flag passed to `claude --model <model>`, empty string = CLI default. */
  model: string
  /** Whether this profile is the floor's orchestrator (Michael). Only one may be. */
  isOrchestrator: boolean
  /** Soft-deletable: hidden from the roster without losing session history. */
  archived: boolean
}

export type SessionStatus =
  | 'idle' // never spawned, or exited and not respawned
  | 'spawning' // pty requested, process not yet confirmed alive
  | 'active' // running, produced output within the activity window
  | 'standby' // running, no output recently (quiet, waiting on the model or the user)
  | 'error' // failed to spawn, or the pty reported an error
  | 'exited' // process exited (see exitCode)

export interface SessionSnapshot {
  sessionId: string
  agentId: string
  status: SessionStatus
  startedAt: number | null
  exitCode: number | null
  errorMessage: string | null
  /** Rough token/cost telemetry parsed from Claude Code's own status line, best-effort. */
  bytesIn: number
  bytesOut: number
}

export interface PtySpawnOptions {
  agentId: string
  cwd: string
  cols: number
  rows: number
  /** Full argv appended after the `claude` binary. */
  args: string[]
}

export interface PtyDataPayload {
  sessionId: string
  chunk: string
}

export interface PtyExitPayload {
  sessionId: string
  exitCode: number
  signal?: number
}

export interface PtyErrorPayload {
  sessionId: string
  message: string
}

export interface CliDetection {
  found: boolean
  binaryPath: string | null
  version: string | null
  error: string | null
}

export interface AppSettings {
  claudeBinary: string
  defaultCwd: string
  activityWindowMs: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  claudeBinary: 'claude',
  defaultCwd: '~',
  activityWindowMs: 2200
}
