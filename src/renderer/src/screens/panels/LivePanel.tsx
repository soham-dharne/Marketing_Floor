import { useState } from 'react'
import type { AgentProfile } from '../../../../shared/types'
import { Orb } from '../../components/Orb'
import { Terminal } from '../../components/Terminal'
import { useSessions, useSessionSnapshot } from '../../state/SessionsProvider'

export function LivePanel({ agent }: { agent: AgentProfile }): JSX.Element {
  const snap = useSessionSnapshot(agent.id)
  const { spawn, kill } = useSessions()
  const [busy, setBusy] = useState(false)
  const hasSession = snap.status !== 'idle' && snap.status !== 'error'

  const handleSpawn = async (): Promise<void> => {
    setBusy(true)
    try {
      await spawn(agent)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      <div
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid var(--sd-line)'
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: agent.color,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '600 12px/1 var(--sd-font-mono)'
          }}
        >
          {agent.mono}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ font: '600 14px/1 var(--sd-font-ui)' }}>{agent.name}</span>
          <span style={{ font: '400 12px/1 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>{agent.role}</span>
        </div>
        <span style={{ marginLeft: 'auto', font: '400 12px/1 var(--sd-font-mono)', color: 'var(--sd-text-faint)' }}>
          {agent.cwd}
        </span>
        {hasSession ? (
          <button className="sd-btn-ghost" style={{ padding: '8px 14px' }} onClick={() => void kill(agent.id)}>
            Stop session
          </button>
        ) : (
          <button className="sd-btn-primary" style={{ padding: '8px 16px' }} disabled={busy} onClick={() => void handleSpawn()}>
            {busy ? 'Starting…' : 'Start session'}
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {hasSession ? (
          <Terminal agentId={agent.id} />
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <Orb state={snap.status === 'error' ? 'error' : 'idle'} size={80} />
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <h2 style={{ margin: 0, font: '500 20px/1.3 var(--sd-font-ui)', letterSpacing: '-.01em' }}>
                {snap.status === 'error' ? 'Session failed to start' : `Talk to ${agent.name}`}
              </h2>
              <p style={{ margin: '8px 0 0', font: '400 13px/1.5 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>
                {snap.errorMessage ||
                  `Starts a real claude session in ${agent.cwd}, with ${agent.name}'s role wired in as its system prompt.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
