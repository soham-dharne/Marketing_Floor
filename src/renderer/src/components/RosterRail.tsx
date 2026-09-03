import type { AgentProfile, SessionStatus } from '../../../shared/types'
import { RosterChip } from './RosterChip'
import { useSessionSnapshot } from '../state/SessionsProvider'

interface RosterRailProps {
  roster: AgentProfile[]
  activeAgentId: string | null
  onSelect: (agentId: string) => void
}

export function RosterRail({ roster, activeAgentId, onSelect }: RosterRailProps): JSX.Element {
  const orchestrator = roster.find((a) => a.isOrchestrator)
  const rest = roster.filter((a) => !a.isOrchestrator && !a.archived)

  return (
    <div
      className="sd-bar"
      style={{
        borderRight: '1px solid var(--sd-line)',
        borderBottom: 'none',
        padding: '22px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflowY: 'auto'
      }}
    >
      <span className="sd-mono" style={{ padding: '0 13px 6px' }}>
        Org
      </span>
      {orchestrator && (
        <PinnedRow agent={orchestrator} selected={activeAgentId === orchestrator.id} onSelect={() => onSelect(orchestrator.id)} />
      )}

      <div style={{ height: 1, background: 'var(--sd-line)', margin: '14px 13px 8px' }} />
      <span className="sd-mono" style={{ padding: '0 13px 6px' }}>
        Roster · {rest.length} agents
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 14 }}>
        {rest.map((agent) => (
          <ConnectedChip key={agent.id} agent={agent} selected={activeAgentId === agent.id} onSelect={() => onSelect(agent.id)} />
        ))}
      </div>
    </div>
  )
}

function PinnedRow({
  agent,
  selected,
  onSelect
}: {
  agent: AgentProfile
  selected: boolean
  onSelect: () => void
}): JSX.Element {
  const snap = useSessionSnapshot(agent.id)
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 13px',
        borderRadius: 20,
        background: 'var(--sd-accent-wash)',
        border: `1px solid ${selected ? 'var(--sd-accent)' : 'var(--sd-accent-border)'}`,
        cursor: 'pointer',
        textAlign: 'left'
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--sd-accent)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '600 13px/1 var(--sd-font-ui)'
        }}
      >
        {agent.mono}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
        <span style={{ font: '500 14px/1 var(--sd-font-ui)' }}>{agent.name}</span>
        <span style={{ font: '400 12px/1 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>{agent.role}</span>
      </div>
      <StatusDot status={snap.status} />
    </button>
  )
}

function StatusDot({ status }: { status: SessionStatus }): JSX.Element {
  const on = status === 'active' || status === 'spawning'
  return (
    <div
      style={{
        marginLeft: 'auto',
        width: 8,
        height: 8,
        borderRadius: 5,
        background: on ? 'var(--sd-accent)' : 'rgba(43,52,64,.28)',
        boxShadow: on ? '0 0 10px rgba(53,97,143,.9)' : 'none',
        animation: on ? 'sd-pulse 3.2s ease-in-out infinite' : 'none'
      }}
    />
  )
}

function ConnectedChip({
  agent,
  selected,
  onSelect
}: {
  agent: AgentProfile
  selected: boolean
  onSelect: () => void
}): JSX.Element {
  const snap = useSessionSnapshot(agent.id)
  return <RosterChip agent={agent} status={snap.status} selected={selected} onSelect={onSelect} />
}
