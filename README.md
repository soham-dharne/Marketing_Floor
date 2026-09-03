# SwarmDesk

An Electron desktop app that puts a real, running fleet of [Claude Code](https://github.com/anthropics/claude-code)
CLI sessions behind the **SwarmDesk Marketing Floor** interface — the light-glass
design imported from `SwarmDesk Flow v2 Light Glass.dc.html`. Every roster
"agent" (Michael the orchestrator, the Floor Manager, Data Analyst, Content
Creator, Copy Editor, Brand Strategist, Paid Ads, SEO Specialist) is a genuine
`claude` process, spawned in a real PTY, with its own working directory and
system prompt. There is no simulated AI behind the roster — you are looking at
real terminals.

## Why it looks like this

The design file this ports is a beautifully detailed *mockup*: a passkey
login with no backend, a token-spend dashboard with invented numbers, an
isometric 3D office you can drag-orbit. Faking that dashboard would be
dishonest in a real app, so every screen was re-grounded in something true
before being built:

| Design artboard | What it pretended to do | What SwarmDesk actually does |
| --- | --- | --- |
| 01 · Login (passkey/authenticator) | Fake biometric auth theatre | Detects the `claude` CLI on your `PATH` through a login shell and confirms it runs, before the floor opens |
| 02 · Floor Arrival | Decorative roster, canned "8 agents · 0 active" | Live roster from disk; the active count is the real number of running PTYs |
| 05 · Floor Graph | Editable node graph with fake temperature dials and tool toggles | Per-agent config editor for the real spawn args: `--model`, `--append-system-prompt`, working directory |
| 06 · Live Floor (orbitable 3D room) | A draggable isometric office | *Not ported* — see [Scope trade-offs](#scope-trade-offs) below |
| 07 · Floor Control | Fabricated token spend / seats / cost table | Real per-session status table + the roster CRUD + app settings that actually drive spawning |

The visual language — the accent blue (`#35618F`), the frosted glass panels,
the roster chip states, the `sd-pulse`/`sd-halo`/`sd-sweep` motion — is
ported faithfully from the design's own CSS. What changed is what the pixels
are *connected to*.

## Architecture

```
src/
  shared/          Types + IPC channel names, imported by all three worlds
  main/            Electron main process
    pty/           node-pty session manager + CLI detection
    store/         JSON-file settings/roster persistence (userData dir)
    ipc/           ipcMain.handle wiring
    index.ts       App bootstrap
    security.ts    BrowserWindow creation with the hardened webPreferences
                    Electron's own security checklist recommends
  preload/         contextBridge API — the only thing the renderer can call
  renderer/        React 19 + XState 5 UI
    state/
      appMachine.ts       Boot → CLI check → Connect → Floor (screen routing)
      sessionMachine.ts   Per-agent PTY lifecycle (idle/spawning/active/
                          standby/error/exited)
      SessionsProvider.tsx  Spawns one sessionMachine actor per roster
                            agent, wires IPC events to them
    theme/          Design tokens ported from the .dc.html source
    components/     GlassPanel, RosterChip, RosterRail, Orb, Terminal, TabBar
    screens/        ConnectScreen, FloorScreen (Live / Graph / Control panels)
```

### The state machine

This is the part the brief asked to reuse from SwarmDesk's own tech: the
design's canvas prototype is itself driven by a small hand-rolled state
class (`this.state = { login, step, tab, node, ... }`, see the `<script
type="text/x-dc">` block at the end of the original `.dc.html`). SwarmDesk
keeps that same shape but replaces the prototype's `setTimeout`-driven fake
transitions with [XState v5](https://stately.ai/docs/xstate) machines driven
by real events:

- **`appMachine`** — mirrors the design's `login` state (`idle → scanning →
  success → done`) but drives it from an actual CLI detection promise, then
  gates entry to the floor exactly like artboard 01 gates artboard 02.
- **`sessionMachine`** — one instance per roster agent. Its `status` field
  (`idle | spawning | active | standby | error | exited`) is the same shape
  as the design's `chip(status)` visual states, except it is fed by the main
  process's real PTY activity timer instead of the mockup's scripted
  `step` counter.

The main process is the single source of truth for whether a PTY is quiet or
producing output (it owns the one activity timer that matters); the renderer
machine only holds that status as typed, guarded state so the UI can never
render an illegal transition (e.g. "stop" on a session that was never
started).

### Security

Follows Electron's own hardening checklist: `contextIsolation: true`,
`nodeIntegration: false`, `sandbox: true`, a restrictive `Content-Security-Policy`,
external links forced through the OS browser, and a preload script that
exposes nothing beyond the typed `window.swarmdesk` API in `src/preload/index.ts`
— no raw `ipcRenderer`, no filesystem access, no `require`.

## Getting started

```bash
npm install     # also runs `electron-builder install-app-deps`, which
                 # rebuilds node-pty's native binding against Electron's
                 # own Node ABI — this needs real internet access to
                 # download Electron's headers, so it will not succeed in
                 # a network-sandboxed CI/agent environment. Re-run
                 # `npx electron-builder install-app-deps` once you have
                 # normal internet access if it fails during install.
npm run dev      # electron-vite dev server + hot reload
npm run build    # typecheck + production build of main/preload/renderer
npm run package:mac   # or :win / :linux — build + electron-builder
```

Requires the [Claude Code CLI](https://github.com/anthropics/claude-code)
(`claude`) installed and on your `PATH` — SwarmDesk shells out to it, it does
not bundle or reimplement it.

> **Note on this repository's own build environment:** this codebase was
> written and verified in a network-sandboxed session — `npm install`,
> `npm run typecheck`, and `npm run build` (electron-vite's production
> bundling of main/preload/renderer) all ran clean here, but the sandbox
> could not reach the hosts Electron and node-gyp need to download
> Electron's prebuilt binary and rebuild node-pty's native addon against it.
> Both of those happen automatically on a normal machine with internet
> access; nothing about the app itself depends on this sandbox.

## Roster & settings

The roster (who's on the floor, their working directory, model flag, system
prompt) and app settings (which `claude` binary to run, default working
directory, the PTY activity window) live in a small JSON file under
Electron's `userData` directory — edit them from **Floor Control** in the
app, or by hand at:

- macOS: `~/Library/Application Support/SwarmDesk/swarmdesk-state.json`
- Linux: `~/.config/SwarmDesk/swarmdesk-state.json`
- Windows: `%APPDATA%\SwarmDesk\swarmdesk-state.json`

## Scope trade-offs

- **No 3D orbitable office (artboard 06).** The source artboard is several
  thousand lines of hand-tuned CSS 3D transforms for a single decorative
  scene. Porting it pixel-for-pixel would be pure set-dressing with zero
  functional value for a tool meant to run real terminals; the floor is
  instead a roster of glass cards, which is honest about being a session
  manager rather than a game engine.
- **Roster "agents" don't autonomously hand off work to each other.** Each
  agent is an independent `claude` session you talk to directly — SwarmDesk
  does not implement inter-agent messaging ("hive mail" in the design). That
  would be a real multi-agent orchestration system in its own right, not a
  UI concern.
- **The "cost of running the floor" numbers are gone.** The design's token
  spend / seats / billing table was fabricated for the mockup; SwarmDesk
  shows what it can actually know (session status, start time, exit code)
  instead of inventing numbers it has no way to compute.
