import { useState } from 'react'
import type { AgentProfile } from '../../../../shared/types'
import { GlassPanel } from '../../components/GlassPanel'
import { useSessionSnapshot } from '../../state/SessionsProvider'

interface GraphPanelProps {
  agent: AgentProfile
  roster: AgentProfile[]
  onSelectAgent: (agentId: string) => void
  onRosterChange: (roster: AgentProfile[]) => void
}

/**
 * The design's 05 · FLOOR GRAPH artboard: a node list on the left picks the
 * agent under inspection, the right side shows its real spawn
 * configuration — model flag, working directory, system prompt — instead
 * of the mockup's decorative temperature dial and tool toggles.
 */
export function GraphPanel({ agent, roster, onSelectAgent, onRosterChange }: GraphPanelProps): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100%', minHeight: 0 }}>
      <div style={{ borderRight: '1px solid var(--sd-line)', padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="sd-mono" style={{ padding: '0 4px 6px' }}>
          Roster nodes
        </span>
        {roster.map((node) => (
          <button
            key={node.id}
            onClick={() => onSelectAgent(node.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 11px',
              borderRadius: 14,
              border: `1px solid ${node.id === agent.id ? node.color : 'var(--sd-line)'}`,
              background: node.id === agent.id ? `${node.color}14` : 'transparent',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: node.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: '600 10px/1 var(--sd-font-mono)'
              }}
            >
              {node.mono}
            </div>
            <span style={{ font: '400 13px/1.2 var(--sd-font-ui)' }}>{node.name}</span>
          </button>
        ))}
      </div>
      <NodeInspector key={agent.id} agent={agent} roster={roster} onRosterChange={onRosterChange} />
    </div>
  )
}

function NodeInspector({
  agent,
  roster,
  onRosterChange
}: {
  agent: AgentProfile
  roster: AgentProfile[]
  onRosterChange: (roster: AgentProfile[]) => void
}): JSX.Element {
  const snap = useSessionSnapshot(agent.id)
  const [model, setModel] = useState(agent.model)
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt)
  const dirty = model !== agent.model || systemPrompt !== agent.systemPrompt

  const save = (): void => {
    onRosterChange(roster.map((a) => (a.id === agent.id ? { ...a, model, systemPrompt } : a)))
  }

  return (
    <div style={{ padding: 26, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ margin: 0, font: '600 22px/1.2 var(--sd-font-ui)', letterSpacing: '-.01em' }}>{agent.name}</h2>
        <span className="sd-mono">{agent.isOrchestrator ? 'ORCHESTRATOR' : 'AGENT'}</span>
      </div>
      <p style={{ margin: 0, font: '400 14px/1.5 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>{agent.role}</p>

      <GlassPanel variant="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Model flag" hint="Passed as --model. Leave blank for the CLI default.">
          <input
            className="sd-input"
            value={model}
            placeholder="claude-sonnet-5"
            onChange={(e) => setModel(e.target.value)}
          />
        </Field>
        <Field label="Working directory">
          <span style={{ font: '400 13px/1.4 var(--sd-font-mono)', color: 'var(--sd-text)' }}>{agent.cwd}</span>
        </Field>
        <Field label="System prompt" hint="Appended via --append-system-prompt on spawn.">
          <textarea
            className="sd-input"
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="sd-btn-primary" style={{ padding: '9px 16px' }} disabled={!dirty} onClick={save}>
            Save config
          </button>
          <span style={{ font: '400 11px/1.5 var(--sd-font-mono)', color: 'var(--sd-text-faint)' }}>
            Applies to new sessions only — a running session keeps the config it was spawned with.
          </span>
        </div>
      </GlassPanel>

      <GlassPanel variant="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="sd-mono">Session</span>
        <Row label="Status" value={snap.status} />
        <Row label="Session id" value={snap.sessionId ? snap.sessionId.slice(0, 8) : '—'} />
        <Row label="Started" value={snap.startedAt ? new Date(snap.startedAt).toLocaleTimeString() : '—'} />
        <Row label="Exit code" value={snap.exitCode === null ? '—' : String(snap.exitCode)} />
      </GlassPanel>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '500 11px/1 var(--sd-font-mono)', letterSpacing: '.08em', color: 'var(--sd-text-faint)' }}>
        {label.toUpperCase()}
      </span>
      {children}
      {hint && <span style={{ font: '400 11px/1.4 var(--sd-font-ui)', color: 'var(--sd-text-faint)' }}>{hint}</span>}
    </label>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ font: '400 12px/1 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>{label}</span>
      <span style={{ font: '500 12px/1 var(--sd-font-mono)', color: 'var(--sd-ink)' }}>{value}</span>
    </div>
  )
}
