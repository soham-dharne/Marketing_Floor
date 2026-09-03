import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_SETTINGS, type AgentProfile, type AppSettings } from '../../shared/types'
import { DEFAULT_ROSTER } from './rosterDefaults'

interface StoreShape {
  settings: AppSettings
  roster: AgentProfile[]
}

/**
 * Tiny JSON-file store under Electron's userData directory. No external
 * dependency: the whole app state fits in a few KB and is read/written
 * synchronously, which is fine — it only happens on app start and on
 * explicit user edits, never on the hot path.
 */
export class SettingsStore {
  private readonly filePath: string
  private data: StoreShape

  constructor() {
    const dir = app.getPath('userData')
    mkdirSync(dir, { recursive: true })
    this.filePath = path.join(dir, 'swarmdesk-state.json')
    this.data = this.load()
  }

  getSettings(): AppSettings {
    return this.data.settings
  }

  saveSettings(next: AppSettings): AppSettings {
    this.data.settings = next
    this.persist()
    return this.data.settings
  }

  getRoster(): AgentProfile[] {
    return this.data.roster
  }

  saveRoster(next: AgentProfile[]): AgentProfile[] {
    this.data.roster = next
    this.persist()
    return this.data.roster
  }

  private load(): StoreShape {
    if (existsSync(this.filePath)) {
      try {
        const raw = readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw) as Partial<StoreShape>
        return {
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          roster: parsed.roster && parsed.roster.length > 0 ? parsed.roster : DEFAULT_ROSTER
        }
      } catch {
        // Corrupt or unreadable state file — fall through to defaults
        // rather than crash the app on startup.
      }
    }
    return { settings: { ...DEFAULT_SETTINGS }, roster: DEFAULT_ROSTER }
  }

  private persist(): void {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }
}
