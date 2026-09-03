import { execFile } from 'node:child_process'
import os from 'node:os'
import type { CliDetection } from '../../shared/types'

/**
 * Resolves the claude binary the same way an interactive shell would —
 * through a login shell so PATH additions from nvm/asdf/homebrew rc files
 * are honored, since a GUI app launched outside a terminal often inherits a
 * much smaller PATH.
 */
export function detectClaudeCli(claudeBinary: string): Promise<CliDetection> {
  return new Promise((resolve) => {
    const isWin = os.platform() === 'win32'
    const shell = isWin ? 'powershell.exe' : process.env.SHELL || '/bin/bash'
    const args = isWin
      ? ['-NoLogo', '-NoProfile', '-Command', `${claudeBinary} --version`]
      : ['-lic', `${claudeBinary} --version`]

    execFile(shell, args, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          found: false,
          binaryPath: null,
          version: null,
          error: stderr?.trim() || error.message
        })
        return
      }
      resolve({
        found: true,
        binaryPath: claudeBinary,
        version: stdout.trim() || stderr.trim() || 'unknown version',
        error: null
      })
    })
  })
}
