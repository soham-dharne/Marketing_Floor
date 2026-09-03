import { ipcMain, dialog, type BrowserWindow } from 'electron'
import { IpcChannel } from '../../shared/ipc-channels'
import type { AgentProfile, AppSettings, PtySpawnOptions } from '../../shared/types'
import { PtyManager } from '../pty/ptyManager'
import { detectClaudeCli } from '../pty/detectCli'
import { SettingsStore } from '../store/settingsStore'

export function registerIpcHandlers(
  win: BrowserWindow,
  store: SettingsStore,
  ptyManager: PtyManager
): void {
  ipcMain.handle(IpcChannel.CliDetect, async () => {
    return detectClaudeCli(store.getSettings().claudeBinary)
  })

  ipcMain.handle(IpcChannel.RosterGet, () => store.getRoster())

  ipcMain.handle(IpcChannel.RosterSave, (_evt, roster: AgentProfile[]) => store.saveRoster(roster))

  ipcMain.handle(IpcChannel.SettingsGet, () => store.getSettings())

  ipcMain.handle(IpcChannel.SettingsSave, (_evt, settings: AppSettings) => store.saveSettings(settings))

  ipcMain.handle(IpcChannel.SessionSpawn, (_evt, opts: PtySpawnOptions) => ptyManager.spawn(opts))

  ipcMain.handle(IpcChannel.SessionWrite, (_evt, sessionId: string, data: string) => {
    ptyManager.write(sessionId, data)
  })

  ipcMain.handle(IpcChannel.SessionResize, (_evt, sessionId: string, cols: number, rows: number) => {
    ptyManager.resize(sessionId, cols, rows)
  })

  ipcMain.handle(IpcChannel.SessionKill, (_evt, sessionId: string) => {
    ptyManager.kill(sessionId)
  })

  ipcMain.handle(IpcChannel.SessionList, () => ptyManager.list())

  ipcMain.handle(IpcChannel.PickDirectory, async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}
