/**
 * Every IPC channel the app uses, in one place, so the allow-list in preload
 * and the handlers in main can never drift from what the renderer calls.
 */
export const IpcChannel = {
  CliDetect: 'cli:detect',
  RosterGet: 'roster:get',
  RosterSave: 'roster:save',
  SettingsGet: 'settings:get',
  SettingsSave: 'settings:save',
  SessionSpawn: 'session:spawn',
  SessionWrite: 'session:write',
  SessionResize: 'session:resize',
  SessionKill: 'session:kill',
  SessionList: 'session:list',
  PickDirectory: 'dialog:pick-directory'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]

/** Event channels the main process pushes to the renderer (webContents.send). */
export const IpcEvent = {
  PtyData: 'pty:data',
  PtyExit: 'pty:exit',
  PtyError: 'pty:error',
  SessionStatus: 'session:status'
} as const

export type IpcEventName = (typeof IpcEvent)[keyof typeof IpcEvent]
