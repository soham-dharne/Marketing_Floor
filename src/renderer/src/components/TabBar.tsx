import type { FloorTab } from '../state/appMachine'

const TABS: { id: FloorTab; label: string; icon: JSX.Element }[] = [
  { id: 'live', label: 'Live', icon: <LiveIcon /> },
  { id: 'graph', label: 'Graph', icon: <GraphIcon /> },
  { id: 'control', label: 'Control', icon: <ControlIcon /> }
]

export function TabBar({ active, onSelect }: { active: FloorTab; onSelect: (tab: FloorTab) => void }): JSX.Element {
  return (
    <div
      className="sd-bar"
      style={{
        borderLeft: '1px solid var(--sd-line)',
        borderBottom: 'none',
        width: 76,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '22px 0'
      }}
    >
      {TABS.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            title={tab.label}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: on ? 'rgba(53,97,143,.15)' : 'transparent',
              color: on ? 'var(--sd-accent)' : 'rgba(43,52,64,.6)',
              transition: 'background .2s ease, color .2s ease'
            }}
          >
            {tab.icon}
            <span style={{ font: '500 9px/1 var(--sd-font-mono)', letterSpacing: '.06em' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function LiveIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function GraphIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="4" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="4" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="14" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 8l6-3M6 10l6 3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
function ControlIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 6h12M3 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="7" cy="6" r="1.8" fill="currentColor" />
      <circle cx="11" cy="12" r="1.8" fill="currentColor" />
    </svg>
  )
}
