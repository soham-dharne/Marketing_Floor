import { app, BrowserWindow } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import path from 'node:path'
import { createMainWindow, rendererDistIndex } from './security'
import { registerIpcHandlers } from './ipc/handlers'
import { PtyManager } from './pty/ptyManager'
import { SettingsStore } from './store/settingsStore'
import { IpcEvent } from '../shared/ipc-channels'

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager | null = null

app.whenReady().then(() => {
  electronApp.setAppUserModelId('ai.sensiwise.swarmdesk')
  app.on('browser-window-created', (_evt, win) => optimizer.watchWindowShortcuts(win))

  const store = new SettingsStore()
  const preloadPath = path.join(__dirname, '../preload/index.cjs')
  mainWindow = createMainWindow(preloadPath, is.dev)

  ptyManager = new PtyManager(
    {
      onData: (sessionId, chunk) => mainWindow?.webContents.send(IpcEvent.PtyData, { sessionId, chunk }),
      onExit: (sessionId, exitCode, signal) =>
        mainWindow?.webContents.send(IpcEvent.PtyExit, { sessionId, exitCode, signal }),
      onError: (sessionId, message) => mainWindow?.webContents.send(IpcEvent.PtyError, { sessionId, message }),
      onStatus: (snapshot) => mainWindow?.webContents.send(IpcEvent.SessionStatus, snapshot)
    },
    () => store.getSettings().claudeBinary,
    () => store.getSettings().activityWindowMs
  )

  registerIpcHandlers(mainWindow, store, ptyManager)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(rendererDistIndex())
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow(preloadPath, is.dev)
    }
  })
})

app.on('window-all-closed', () => {
  ptyManager?.killAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  ptyManager?.killAll()
})
