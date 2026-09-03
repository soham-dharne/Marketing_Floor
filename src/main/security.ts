import { BrowserWindow, session, shell } from 'electron'
import path from 'node:path'

/**
 * Creates the app's single window with the strict defaults Electron's own
 * security checklist recommends: no Node integration in the renderer,
 * context isolation on, the sandbox on, and a CSP that only allows the
 * bundle's own origin (dev server in development, file:// in production).
 */
export function createMainWindow(preloadPath: string, isDev: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    backgroundColor: '#E8EDF4',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  })

  win.once('ready-to-show', () => win.show())

  // Every external link opens in the OS browser, never inside the app shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternal(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (!isDev || !url.startsWith('http://localhost')) event.preventDefault()
  })

  applyContentSecurityPolicy(isDev)

  return win
}

function isSafeExternal(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function applyContentSecurityPolicy(isDev: boolean): void {
  const connectSrc = isDev ? "'self' ws://localhost:* http://localhost:*" : "'self'"
  const csp = [
    "default-src 'self'",
    // Vite's dev server injects an inline HMR client script; production
    // builds serve everything as external files with no inline script.
    `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`
  ].join('; ')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })
}

export function rendererDistIndex(): string {
  return path.join(__dirname, '../renderer/index.html')
}
