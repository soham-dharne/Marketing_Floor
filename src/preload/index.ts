import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannel } from '../shared/ipc-channels'
import { IpcEvent } from '../shared/ipc-channels'
import type {
  AgentProfile,
  AppSettings,
  CliDetection,
  PtyDataPayload,
  PtyErrorPayload,
  PtyExitPayload,
  PtySpawnOptions,
  SessionSnapshot
} from '../shared/types'

/** Wraps ipcRenderer.on so callers get an unsubscribe function back and never leak listeners. */
function subscribe<T>(channel: string, handler: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => handler(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const swarmdesk = {
  detectCli: (): Promise<CliDetection> => ipcRenderer.invoke(IpcChannel.CliDetect),

  getRoster: (): Promise<AgentProfile[]> => ipcRenderer.invoke(IpcChannel.RosterGet),
  saveRoster: (roster: AgentProfile[]): Promise<AgentProfile[]> =>
    ipcRenderer.invoke(IpcChannel.RosterSave, roster),

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannel.SettingsGet),
  saveSettings: (settings: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannel.SettingsSave, settings),

  pickDirectory: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.PickDirectory),

  spawnSession: (opts: PtySpawnOptions): Promise<SessionSnapshot> =>
    ipcRenderer.invoke(IpcChannel.SessionSpawn, opts),
  writeSession: (sessionId: string, data: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.SessionWrite, sessionId, data),
  resizeSession: (sessionId: string, cols: number, rows: number): Promise<void> =>
    ipcRenderer.invoke(IpcChannel.SessionResize, sessionId, cols, rows),
  killSession: (sessionId: string): Promise<void> => ipcRenderer.invoke(IpcChannel.SessionKill, sessionId),
  listSessions: (): Promise<SessionSnapshot[]> => ipcRenderer.invoke(IpcChannel.SessionList),

  onPtyData: (handler: (payload: PtyDataPayload) => void) => subscribe(IpcEvent.PtyData, handler),
  onPtyExit: (handler: (payload: PtyExitPayload) => void) => subscribe(IpcEvent.PtyExit, handler),
  onPtyError: (handler: (payload: PtyErrorPayload) => void) => subscribe(IpcEvent.PtyError, handler),
  onSessionStatus: (handler: (payload: SessionSnapshot) => void) => subscribe(IpcEvent.SessionStatus, handler)
}

export type SwarmDeskApi = typeof swarmdesk

contextBridge.exposeInMainWorld('swarmdesk', swarmdesk)
