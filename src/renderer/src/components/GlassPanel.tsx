import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'panel' | 'card'
  style?: CSSProperties
}

/** The frosted-glass surface every SwarmDesk panel and card is built from. */
export function GlassPanel({ children, variant = 'panel', className = '', ...rest }: GlassPanelProps): JSX.Element {
  const base = variant === 'panel' ? 'sd-panel' : 'sd-card'
  return (
    <div className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}
