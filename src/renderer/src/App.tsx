import { useMachine } from '@xstate/react'
import { useEffect, useState } from 'react'
import type { AgentProfile } from '../../shared/types'
import { ConnectScreen } from './screens/ConnectScreen'
import { FloorScreen } from './screens/FloorScreen'
import { appMachine } from './state/appMachine'
import { SessionsProvider } from './state/SessionsProvider'

export function App(): JSX.Element {
  const [state, send] = useMachine(appMachine)
  const [roster, setRoster] = useState<AgentProfile[] | null>(null)

  useEffect(() => {
    void window.swarmdesk.getRoster().then(setRoster)
  }, [])

  useEffect(() => {
    if (state.matches('floor') && roster && !state.context.activeAgentId) {
      const orchestrator = roster.find((a) => a.isOrchestrator) ?? roster[0]
      if (orchestrator) send({ type: 'SELECT_AGENT', agentId: orchestrator.id })
    }
  }, [state, roster, send])

  const handleRosterChange = (next: AgentProfile[]): void => {
    setRoster(next)
    void window.swarmdesk.saveRoster(next)
  }

  if (state.matches('boot') || !roster) {
    return <ConnectScreen phase="booting" cli={null} onConnect={() => {}} onRetry={() => {}} />
  }
  if (state.matches('cliMissing')) {
    return (
      <ConnectScreen
        phase="cliMissing"
        cli={state.context.cli}
        onConnect={() => {}}
        onRetry={() => send({ type: 'RETRY_CLI' })}
      />
    )
  }
  if (state.matches({ connect: 'idle' })) {
    return <ConnectScreen phase="idle" cli={state.context.cli} onConnect={() => send({ type: 'CONNECT' })} onRetry={() => {}} />
  }
  if (state.matches({ connect: 'verifying' })) {
    return <ConnectScreen phase="verifying" cli={state.context.cli} onConnect={() => {}} onRetry={() => {}} />
  }
  if (state.matches({ connect: 'success' })) {
    return <ConnectScreen phase="success" cli={state.context.cli} onConnect={() => {}} onRetry={() => {}} />
  }

  return (
    <SessionsProvider roster={roster}>
      <FloorScreen
        roster={roster}
        activeAgentId={state.context.activeAgentId}
        activeTab={state.context.activeTab}
        onSelectAgent={(agentId) => send({ type: 'SELECT_AGENT', agentId })}
        onSelectTab={(tab) => send({ type: 'SET_TAB', tab })}
        onRosterChange={handleRosterChange}
      />
    </SessionsProvider>
  )
}
