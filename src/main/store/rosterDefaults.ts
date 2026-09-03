import type { AgentProfile } from '../../shared/types'

/**
 * The Marketing Floor roster from the SwarmDesk design, ported 1:1 —
 * same names, monograms and accent colors as the design's `Component.NODES`
 * table, now wired to real spawn config instead of decorative fixtures.
 */
export const DEFAULT_ROSTER: AgentProfile[] = [
  {
    id: 'michael',
    name: 'Michael',
    role: 'Chief of Staff · Orchestrator',
    mono: 'MI',
    color: '#35618F',
    cwd: '~',
    systemPrompt:
      'You are Michael, Chief of Staff on the Marketing Floor. You are talked to directly by the operator and you route work to the floor. Be decisive and concise.',
    model: '',
    isOrchestrator: true,
    archived: false
  },
  {
    id: 'floor-manager',
    name: 'Floor Manager',
    role: 'Dispatcher',
    mono: 'FM',
    color: '#2C3138',
    cwd: '~',
    systemPrompt: 'You are the Floor Manager. You fan work out to the roster and track the task queue. Be terse.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    role: 'Reads sources, never writes copy',
    mono: 'DA',
    color: '#2E7D74',
    cwd: '~',
    systemPrompt: 'You are the Data Analyst. Read data sources and report numbers precisely. Never draft marketing copy.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    role: 'Writes drafts, cannot ship',
    mono: 'CC',
    color: '#C1663A',
    cwd: '~',
    systemPrompt: 'You are the Content Creator. Draft marketing copy from briefs. You never publish directly — a human always reviews first.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'copy-editor',
    name: 'Copy Editor',
    role: 'Human gate — nothing ships unread',
    mono: 'CE',
    color: '#6B5BA8',
    cwd: '~',
    systemPrompt: 'You are the Copy Editor. Review drafts for accuracy, tone and brand voice before anything ships.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'brand-strategist',
    name: 'Brand Strategist',
    role: 'Owns positioning language',
    mono: 'BS',
    color: '#B08428',
    cwd: '~',
    systemPrompt: 'You are the Brand Strategist. Own positioning language and keep every deliverable consistent with it.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'paid-ads',
    name: 'Paid Ads',
    role: 'Spend authority withheld',
    mono: 'PA',
    color: '#A9412C',
    cwd: '~',
    systemPrompt: 'You are the Paid Ads specialist. You plan campaigns but never execute spend without explicit operator approval.',
    model: '',
    isOrchestrator: false,
    archived: false
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    role: 'Search surface only',
    mono: 'SE',
    color: '#4E7C3A',
    cwd: '~',
    systemPrompt: 'You are the SEO Specialist. Work the search surface: keywords, on-page structure, technical SEO.',
    model: '',
    isOrchestrator: false,
    archived: false
  }
]
