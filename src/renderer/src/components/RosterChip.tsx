import type { AgentProfile, SessionStatus } from '../../../shared/types'

interface ChipVisual {
  bg: string
  border: string
  glow: string
  opacity: number
  scale: number
  avatarBg: string
  avatarFg: string
  pill: string
  pillFg: string
  dot: string
  dotGlow: string
  pulse: boolean
}

function visualFor(status: SessionStatus, color: string): ChipVisual {
  switch (status) {
    case 'active':
      return {
        bg: `${color}12`,
        border: `${color}4d`,
        glow: `0 8px 24px -10px ${color}8c`,
        opacity: 1,
        scale: 1.02,
        avatarBg: color,
        avatarFg: '#fff',
        pill: 'active',
        pillFg: color,
        dot: color,
        dotGlow: `0 0 8px ${color}e6`,
        pulse: true
      }
    case 'spawning':
      return {
        bg: `${color}0d`,
        border: `${color}40`,
        glow: 'none',
        opacity: 1,
        scale: 1,
        avatarBg: `${color}55`,
        avatarFg: '#fff',
        pill: 'connecting…',
        pillFg: color,
        dot: color,
        dotGlow: 'none',
        pulse: true
      }
    case 'standby':
      return {
        bg: 'rgba(255,255,255,.68)',
        border: 'rgba(24,39,60,.16)',
        glow: '0 8px 24px -10px rgba(24,39,60,.14)',
        opacity: 1,
        scale: 1.02,
        avatarBg: 'rgba(24,39,60,.13)',
        avatarFg: '#141A22',
        pill: 'standby',
        pillFg: 'rgba(20,26,34,.82)',
        dot: 'rgba(20,26,34,.82)',
        dotGlow: 'none',
        pulse: false
      }
    case 'error':
      return {
        bg: 'rgba(169,65,44,.07)',
        border: 'rgba(169,65,44,.32)',
        glow: '0 8px 24px -10px rgba(169,65,44,.4)',
        opacity: 1,
        scale: 1,
        avatarBg: 'var(--sd-bad)',
        avatarFg: '#fff',
        pill: 'error',
        pillFg: 'var(--sd-bad)',
        dot: 'var(--sd-bad)',
        dotGlow: '0 0 8px rgba(169,65,44,.7)',
        pulse: false
      }
    case 'exited':
      return {
        bg: 'rgba(255,255,255,.5)',
        border: 'rgba(24,39,60,.1)',
        glow: 'none',
        opacity: 0.7,
        scale: 1,
        avatarBg: 'rgba(24,39,60,.06)',
        avatarFg: 'rgba(43,52,64,.6)',
        pill: 'stopped',
        pillFg: 'rgba(43,52,64,.55)',
        dot: 'rgba(43,52,64,.25)',
        dotGlow: 'none',
        pulse: false
      }
    case 'idle':
    default:
      return {
        bg: 'rgba(255,255,255,.5)',
        border: 'rgba(255,255,255,.66)',
        glow: 'none',
        opacity: 0.6,
        scale: 1,
        avatarBg: 'rgba(24,39,60,.08)',
        avatarFg: 'rgba(43,52,64,.72)',
        pill: 'idle',
        pillFg: 'rgba(43,52,64,.55)',
        dot: 'rgba(43,52,64,.3)',
        dotGlow: 'none',
        pulse: false
      }
  }
}

interface RosterChipProps {
  agent: AgentProfile
  status: SessionStatus
  selected: boolean
  onSelect: () => void
}

/** One roster row — a direct port of the design's `chip()` status system, driven by real PTY status. */
export function RosterChip({ agent, status, selected, onSelect }: RosterChipProps): JSX.Element {
  const v = visualFor(status, agent.color)
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 12px',
        borderRadius: 18,
        background: v.bg,
        border: `1px solid ${selected ? agent.color : v.border}`,
        boxShadow: selected ? `0 0 0 2px ${agent.color}29, ${v.glow}` : v.glow,
        opacity: v.opacity,
        transform: `scale(${v.scale})`,
        transition: 'all .25s ease',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left'
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          flex: 'none',
          borderRadius: '50%',
          background: v.avatarBg,
          color: v.avatarFg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '600 11px/1 var(--sd-font-mono)',
          boxShadow: status === 'active' ? `0 3px 8px -2px ${agent.color}77` : 'none'
        }}
      >
        {agent.mono}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <span
          style={{
            font: '400 13px/1.25 var(--sd-font-ui)',
            color: 'rgba(43,52,64,.85)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {agent.name}
        </span>
        {status !== 'idle' && (
          <span style={{ font: '500 10px/1 var(--sd-font-mono)', color: v.pillFg }}>{v.pill}</span>
        )}
      </div>
      <div
        style={{
          marginLeft: 'auto',
          width: 6,
          height: 6,
          borderRadius: 4,
          background: v.dot,
          boxShadow: v.dotGlow,
          animation: v.pulse ? 'sd-pulse 2.4s ease-in-out infinite' : 'none'
        }}
      />
    </button>
  )
}
