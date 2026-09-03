import { FitAddon } from '@xterm/addon-fit'
import { Terminal as XTerm } from '@xterm/xterm'
import { useEffect, useRef } from 'react'
import '@xterm/xterm/css/xterm.css'
import { useSessions } from '../state/SessionsProvider'

const XTERM_THEME = {
  background: '#00000000',
  foreground: '#1c2430',
  cursor: '#35618f',
  cursorAccent: '#ffffff',
  selectionBackground: 'rgba(53,97,143,.28)',
  black: '#1c2430',
  red: '#a9412c',
  green: '#2e7d74',
  yellow: '#b08428',
  blue: '#35618f',
  magenta: '#6b5ba8',
  cyan: '#2e7d74',
  white: '#e8edf4',
  brightBlack: '#5a6472',
  brightRed: '#c1663a',
  brightGreen: '#4e7c3a',
  brightYellow: '#d9a83d',
  brightBlue: '#5e8bc0',
  brightMagenta: '#8a7ac9',
  brightCyan: '#4aa89b',
  brightWhite: '#141a22'
}

/** One xterm.js instance bound to a single roster agent's PTY session. Instances are kept per-agentId so switching tabs doesn't lose scrollback. */
export function Terminal({ agentId }: { agentId: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const { write, resize, subscribeData } = useSessions()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const term = new XTerm({
      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      allowProposedApi: true,
      theme: XTERM_THEME
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(container)
    fit.fit()
    resize(agentId, term.cols, term.rows)

    const offData = subscribeData(agentId, (chunk) => term.write(chunk))
    const offInput = term.onData((data) => write(agentId, data))

    const resizeObserver = new ResizeObserver(() => {
      fit.fit()
      resize(agentId, term.cols, term.rows)
    })
    resizeObserver.observe(container)

    return () => {
      offData()
      offInput.dispose()
      resizeObserver.disconnect()
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- agentId identifies the session; write/resize/subscribeData are stable
  }, [agentId])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', padding: '4px 8px' }} />
}
