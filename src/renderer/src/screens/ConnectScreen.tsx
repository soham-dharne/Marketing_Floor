import type { CliDetection } from '../../../shared/types'
import { GlassPanel } from '../components/GlassPanel'
import { Orb, type OrbState } from '../components/Orb'
import logo from '../assets/sensiwise-mark.svg'

type ConnectPhase = 'booting' | 'cliMissing' | 'idle' | 'verifying' | 'success'

interface ConnectScreenProps {
  phase: ConnectPhase
  cli: CliDetection | null
  onConnect: () => void
  onRetry: () => void
}

/**
 * The design's 01 · LOGIN artboard, repurposed: there is no real backend to
 * authenticate against on a desktop app, so instead of faking a passkey
 * check this screen does something true — it confirms the Claude Code CLI
 * is installed and runnable through the user's shell before letting them
 * onto the floor.
 */
export function ConnectScreen({ phase, cli, onConnect, onRetry }: ConnectScreenProps): JSX.Element {
  const orbState: OrbState =
    phase === 'verifying' ? 'busy' : phase === 'success' ? 'success' : phase === 'cliMissing' ? 'error' : 'idle'

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <GlassPanel
        variant="card"
        style={{
          width: 420,
          padding: '36px 34px 30px',
          background: 'rgba(255,255,255,.62)',
          backdropFilter: 'var(--sd-glass-blur-strong)',
          WebkitBackdropFilter: 'var(--sd-glass-blur-strong)',
          border: '1px solid rgba(255,255,255,.8)',
          boxShadow: '0 30px 70px -34px rgba(24,39,60,.4), inset 0 1px 0 rgba(255,255,255,.95)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              background: 'var(--sd-accent)',
              boxShadow: '0 4px 14px -2px rgba(53,97,143,.6)'
            }}
          />
          <span style={{ font: '600 15px/1 var(--sd-font-ui)', letterSpacing: '-.01em' }}>SwarmDesk</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '8px 0' }}>
          <Orb state={orbState} size={72} />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, font: '600 26px/1.2 var(--sd-font-ui)', letterSpacing: '-.02em' }}>
              {headline(phase)}
            </h1>
            <p style={{ margin: '8px 0 0', font: '400 14px/1.5 var(--sd-font-ui)', color: 'var(--sd-text-muted)' }}>
              {subhead(phase, cli)}
            </p>
          </div>
        </div>

        {phase === 'cliMissing' && (
          <GlassPanel
            variant="card"
            style={{ padding: 14, background: 'rgba(169,65,44,.06)', border: '1px solid rgba(169,65,44,.22)' }}
          >
            <span style={{ font: '400 12px/1.6 var(--sd-font-mono)', color: 'var(--sd-text)' }}>
              {cli?.error || 'The `claude` binary could not be found on your PATH.'}
            </span>
          </GlassPanel>
        )}

        {phase === 'idle' && (
          <button className="sd-btn-primary" style={{ height: 50, width: '100%' }} onClick={onConnect}>
            Connect to Claude Code
          </button>
        )}
        {phase === 'cliMissing' && (
          <button className="sd-btn-primary" style={{ height: 50, width: '100%' }} onClick={onRetry}>
            Retry detection
          </button>
        )}
        {phase === 'verifying' && (
          <div style={{ textAlign: 'center', font: '500 13px/1 var(--sd-font-mono)', color: 'var(--sd-text-muted)' }}>
            Verifying device…
          </div>
        )}
        {phase === 'success' && (
          <div
            style={{
              textAlign: 'center',
              font: '500 13px/1 var(--sd-font-mono)',
              color: 'var(--sd-accent-dark)'
            }}
          >
            {cli?.version} · the floor opens →
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <img src={logo} alt="" style={{ width: 52, height: 23, opacity: 0.7 }} />
          <span style={{ font: '400 12px/1 var(--sd-font-ui)', color: 'var(--sd-text-faint)' }}>
            Product developed at sensiwise.ai
          </span>
        </div>
      </GlassPanel>
    </div>
  )
}

function headline(phase: ConnectPhase): string {
  switch (phase) {
    case 'booting':
      return 'Checking your machine…'
    case 'cliMissing':
      return 'Claude Code not found'
    case 'idle':
      return 'Welcome back.'
    case 'verifying':
      return 'Checking device…'
    case 'success':
      return 'Connected.'
  }
}

function subhead(phase: ConnectPhase, cli: CliDetection | null): string {
  switch (phase) {
    case 'booting':
      return 'Looking for the claude CLI on your PATH.'
    case 'cliMissing':
      return 'Install it with `npm install -g @anthropic-ai/claude-code`, then retry.'
    case 'idle':
      return cli?.version ? `${cli.version} · ready to open the floor.` : 'Ready to open the floor.'
    case 'verifying':
      return 'Confirming the CLI responds before the floor opens.'
    case 'success':
      return 'Michael is standing by.'
  }
}
