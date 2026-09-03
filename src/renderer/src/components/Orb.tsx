export type OrbState = 'idle' | 'busy' | 'success' | 'error'

const HALO_ANIM: Record<OrbState, string> = {
  idle: 'sd-halo 4.5s ease-in-out infinite',
  busy: 'sd-halo 1.4s ease-in-out infinite',
  success: 'sd-halo 4.5s ease-in-out infinite',
  error: 'sd-halo 4.5s ease-in-out infinite'
}

const RING_COLOR: Record<OrbState, string> = {
  idle: 'var(--sd-accent)',
  busy: 'var(--sd-accent)',
  success: 'var(--sd-good)',
  error: 'var(--sd-bad)'
}

/** The glowing status orb from the design's passkey card and floor-arrival hero, generalized to any state. */
export function Orb({ state, size = 66 }: { state: OrbState; size?: number }): JSX.Element {
  const ring = RING_COLOR[state]
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ring}55, transparent 70%)`,
          animation: HALO_ANIM[state]
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: size * 0.16,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          border: `1.5px solid ${ring}`,
          boxShadow: '0 10px 24px -12px rgba(24,39,60,0.4), inset 0 1px 0 rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: state === 'busy' ? 'sd-breathe 1.6s ease-in-out infinite' : 'sd-breathe 4.4s ease-in-out infinite'
        }}
      >
        {state === 'success' && <CheckIcon color={ring} />}
        {state === 'error' && <ErrorIcon color={ring} />}
        {(state === 'idle' || state === 'busy') && <SwarmIcon color={ring} />}
      </div>
      {state === 'busy' && (
        <div
          style={{
            position: 'absolute',
            left: size * 0.1,
            right: size * 0.1,
            top: '50%',
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${ring}, transparent)`,
            animation: 'sd-sweep 1.1s ease-in-out infinite'
          }}
        />
      )}
    </div>
  )
}

function SwarmIcon({ color }: { color: string }): JSX.Element {
  return (
    <svg width="46%" height="46%" viewBox="0 0 72 72" fill="none">
      <path
        d="M6 22V12a6 6 0 016-6h10M50 6h10a6 6 0 016 6v10M66 50v10a6 6 0 01-6 6H50M22 66H12a6 6 0 01-6-6V50"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="27" cy="31" r="2.8" fill={color} />
      <circle cx="45" cy="31" r="2.8" fill={color} />
      <path d="M27 45c2.6 2.6 5.6 3.9 9 3.9s6.4-1.3 9-3.9" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ color }: { color: string }): JSX.Element {
  return (
    <svg width="46%" height="46%" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" stroke={color} strokeWidth="3.2" />
      <path d="M23 37l9.5 9.5L50 28" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon({ color }: { color: string }): JSX.Element {
  return (
    <svg width="46%" height="46%" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="30" stroke={color} strokeWidth="3.2" />
      <path d="M25 25l22 22M47 25L25 47" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
