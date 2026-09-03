import { useRosterCounts } from '../state/SessionsProvider'

export function TopBar(): JSX.Element {
  const { active, total } = useRosterCounts()
  return (
    <div
      className="sd-bar sd-drag"
      style={{
        height: 54,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 14
      }}
    >
      <div style={{ width: 68 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 16, height: 16, borderRadius: 5, background: 'var(--sd-accent)' }} />
        <span style={{ font: '600 14px/1 var(--sd-font-ui)', letterSpacing: '-.01em' }}>SwarmDesk</span>
      </div>
      <span style={{ marginLeft: 'auto', marginRight: 'auto', font: '500 14px/1 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>
        Marketing Floor
      </span>
      <span style={{ font: '400 13px/1 var(--sd-font-ui)', color: 'var(--sd-text-faint)' }}>
        {total} agents · {active} active
      </span>
    </div>
  )
}
