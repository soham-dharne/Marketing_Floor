import { useEffect, useState } from 'react'
import type { AgentProfile, AppSettings } from '../../../../shared/types'
import { DEFAULT_SETTINGS } from '../../../../shared/types'
import { GlassPanel } from '../../components/GlassPanel'
import { useSessionSnapshot } from '../../state/SessionsProvider'

const PALETTE = ['#35618F', '#2E7D74', '#C1663A', '#6B5BA8', '#B08428', '#A9412C', '#4E7C3A', '#2C3138']

interface ControlPanelProps {
  roster: AgentProfile[]
  onRosterChange: (roster: AgentProfile[]) => void
}

/**
 * The design's 07 · FLOOR CONTROL artboard, made real: instead of a fake
 * token-spend dashboard, this is where the roster is actually managed
 * (add/edit/remove agent profiles) and where the app's own settings —
 * which claude binary to run, the default working directory, how long a
 * quiet PTY stays "active" before the chip drops to standby — are set.
 */
export function ControlPanel({ roster, onRosterChange }: ControlPanelProps): JSX.Element {
  return (
    <div style={{ padding: '22px 26px 26px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <SettingsSection />
      <SessionsSection roster={roster} />
      <RosterSection roster={roster} onRosterChange={onRosterChange} />
    </div>
  )
}

function SettingsSection(): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    void window.swarmdesk.getSettings().then(setSettings)
  }, [])

  const update = (patch: Partial<AppSettings>): void => {
    setSettings((s) => ({ ...s, ...patch }))
    setSaved(false)
  }

  const save = async (): Promise<void> => {
    await window.swarmdesk.saveSettings(settings)
    setSaved(true)
  }

  const pickCwd = async (): Promise<void> => {
    const dir = await window.swarmdesk.pickDirectory()
    if (dir) update({ defaultCwd: dir })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="sd-mono">Floor settings</span>
      <GlassPanel variant="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>CLAUDE BINARY</span>
          <input className="sd-input" value={settings.claudeBinary} onChange={(e) => update({ claudeBinary: e.target.value })} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>DEFAULT WORKING DIRECTORY</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="sd-input" value={settings.defaultCwd} onChange={(e) => update({ defaultCwd: e.target.value })} />
            <button className="sd-btn-ghost" style={{ padding: '0 12px' }} onClick={() => void pickCwd()}>
              Browse
            </button>
          </div>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={labelStyle}>ACTIVITY WINDOW (MS)</span>
          <input
            className="sd-input"
            type="number"
            min={400}
            step={100}
            value={settings.activityWindowMs}
            onChange={(e) => update({ activityWindowMs: Number(e.target.value) })}
          />
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="sd-btn-primary" style={{ padding: '10px 18px' }} disabled={saved} onClick={() => void save()}>
            {saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}

function SessionsSection({ roster }: { roster: AgentProfile[] }): JSX.Element {
  const live = roster.filter((a) => !a.archived)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="sd-mono">Live sessions</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {live.map((agent) => (
          <SessionRow key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}

function SessionRow({ agent }: { agent: AgentProfile }): JSX.Element {
  const snap = useSessionSnapshot(agent.id)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 100px 1fr 140px 90px',
        gap: 14,
        alignItems: 'center',
        padding: '11px 14px',
        borderRadius: 13,
        background: 'rgba(255,255,255,.66)',
        border: '1px solid var(--sd-line)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 9,
            background: agent.color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '600 10px/1 var(--sd-font-mono)'
          }}
        >
          {agent.mono}
        </div>
        <span style={{ font: '400 13px/1.2 var(--sd-font-ui)' }}>{agent.name}</span>
      </div>
      <span style={{ font: '500 12px/1 var(--sd-font-mono)', color: statusColor(snap.status) }}>{snap.status}</span>
      <span style={{ font: '400 12px/1 var(--sd-font-mono)', color: 'var(--sd-text-faint)' }}>
        {snap.sessionId ? snap.sessionId.slice(0, 8) : '—'}
      </span>
      <span style={{ font: '400 12px/1 var(--sd-font-mono)', color: 'var(--sd-text-faint)' }}>
        {snap.startedAt ? new Date(snap.startedAt).toLocaleTimeString() : '—'}
      </span>
      <span style={{ font: '500 12px/1 var(--sd-font-mono)', textAlign: 'right' }}>
        {snap.exitCode === null ? '—' : `exit ${snap.exitCode}`}
      </span>
    </div>
  )
}

function statusColor(status: string): string {
  if (status === 'active' || status === 'spawning') return 'var(--sd-accent)'
  if (status === 'error') return 'var(--sd-bad)'
  if (status === 'standby') return 'var(--sd-ink)'
  return 'var(--sd-text-faint)'
}

function RosterSection({ roster, onRosterChange }: ControlPanelProps): JSX.Element {
  const addAgent = (): void => {
    const id = `agent-${Date.now().toString(36)}`
    onRosterChange([
      ...roster,
      {
        id,
        name: 'New agent',
        role: 'Unconfigured',
        mono: 'NA',
        color: PALETTE[roster.length % PALETTE.length],
        cwd: '~',
        systemPrompt: '',
        model: '',
        isOrchestrator: false,
        archived: false
      }
    ])
  }

  const updateAgent = (id: string, patch: Partial<AgentProfile>): void => {
    onRosterChange(roster.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const removeAgent = (id: string): void => {
    onRosterChange(roster.filter((a) => a.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="sd-mono">Roster</span>
        <button className="sd-btn-ghost" style={{ marginLeft: 'auto', padding: '6px 12px' }} onClick={addAgent}>
          + Add agent
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {roster.map((agent) => (
          <GlassPanel
            key={agent.id}
            variant="card"
            style={{ padding: 14, display: 'grid', gridTemplateColumns: '90px 1.4fr 1.6fr 1.2fr auto', gap: 10, alignItems: 'center' }}
          >
            <input
              className="sd-input"
              value={agent.mono}
              maxLength={2}
              onChange={(e) => updateAgent(agent.id, { mono: e.target.value.toUpperCase() })}
            />
            <input className="sd-input" value={agent.name} onChange={(e) => updateAgent(agent.id, { name: e.target.value })} />
            <input className="sd-input" value={agent.role} onChange={(e) => updateAgent(agent.id, { role: e.target.value })} />
            <input className="sd-input" value={agent.cwd} onChange={(e) => updateAgent(agent.id, { cwd: e.target.value })} />
            <button
              className="sd-btn-ghost"
              style={{ padding: '9px 12px', color: 'var(--sd-bad)' }}
              disabled={agent.isOrchestrator}
              onClick={() => removeAgent(agent.id)}
              title={agent.isOrchestrator ? 'The orchestrator cannot be removed' : 'Remove'}
            >
              Remove
            </button>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  font: '500 10px/1 var(--sd-font-mono)',
  letterSpacing: '.1em',
  color: 'var(--sd-text-faint)'
}
