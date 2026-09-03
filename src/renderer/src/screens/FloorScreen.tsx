import type { AgentProfile } from '../../../shared/types'
import { RosterRail } from '../components/RosterRail'
import { TabBar } from '../components/TabBar'
import { TopBar } from '../components/TopBar'
import type { FloorTab } from '../state/appMachine'
import { ControlPanel } from './panels/ControlPanel'
import { GraphPanel } from './panels/GraphPanel'
import { LivePanel } from './panels/LivePanel'

interface FloorScreenProps {
  roster: AgentProfile[]
  activeAgentId: string | null
  activeTab: FloorTab
  onSelectAgent: (agentId: string) => void
  onSelectTab: (tab: FloorTab) => void
  onRosterChange: (roster: AgentProfile[]) => void
}

export function FloorScreen({
  roster,
  activeAgentId,
  activeTab,
  onSelectAgent,
  onSelectTab,
  onRosterChange
}: FloorScreenProps): JSX.Element {
  const activeAgent = roster.find((a) => a.id === activeAgentId) ?? roster[0]

  return (
    <div className="sd-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, border: 'none' }}>
      <TopBar />
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '268px 1fr 76px' }}>
        <RosterRail roster={roster} activeAgentId={activeAgent?.id ?? null} onSelect={onSelectAgent} />
        <div style={{ minWidth: 0, minHeight: 0 }}>
          {!activeAgent ? (
            <EmptyFloor />
          ) : activeTab === 'live' ? (
            <LivePanel agent={activeAgent} />
          ) : activeTab === 'graph' ? (
            <GraphPanel agent={activeAgent} roster={roster} onSelectAgent={onSelectAgent} onRosterChange={onRosterChange} />
          ) : (
            <ControlPanel roster={roster} onRosterChange={onRosterChange} />
          )}
        </div>
        <TabBar active={activeTab} onSelect={onSelectTab} />
      </div>
    </div>
  )
}

function EmptyFloor(): JSX.Element {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sd-text-muted)' }}>
      No agents on the roster yet.
    </div>
  )
}
