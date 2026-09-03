import { assign, setup } from 'xstate'
import type { SessionStatus } from '../../../shared/types'

/**
 * Per-agent session state. The PTY's lifecycle telemetry (active vs standby
 * vs exited) is computed authoritatively in the main process, which owns
 * the one activity timer that matters — duplicating that timer here would
 * just be a second, slightly-out-of-sync source of truth. Instead this
 * machine holds `status` as an explicit enum in context, and only ever
 * moves it forward through the guarded STATUS/KILL_REQUESTED transitions
 * below, so the UI can never render an illegal state (e.g. "kill" on a
 * session that was never spawned).
 */

export interface SessionContext {
  agentId: string
  sessionId: string | null
  status: SessionStatus
  startedAt: number | null
  exitCode: number | null
  errorMessage: string | null
}

export type SessionEvent =
  | { type: 'SPAWN_REQUESTED' }
  | {
      type: 'STATUS'
      sessionId: string
      status: SessionStatus
      startedAt: number | null
      exitCode: number | null
      errorMessage: string | null
    }
  | { type: 'KILL_REQUESTED' }

export const sessionMachine = setup({
  types: {
    context: {} as SessionContext,
    events: {} as SessionEvent,
    input: {} as { agentId: string }
  }
}).createMachine({
  id: 'session',
  context: ({ input }) => ({
    agentId: input.agentId,
    sessionId: null,
    status: 'idle',
    startedAt: null,
    exitCode: null,
    errorMessage: null
  }),
  initial: 'tracking',
  states: {
    tracking: {
      on: {
        SPAWN_REQUESTED: {
          guard: ({ context }) => context.status !== 'spawning' && context.status !== 'active',
          actions: assign({ status: 'spawning', errorMessage: null, exitCode: null })
        },
        STATUS: {
          actions: assign({
            sessionId: ({ event }) => event.sessionId,
            status: ({ event }) => event.status,
            startedAt: ({ event }) => event.startedAt,
            exitCode: ({ event }) => event.exitCode,
            errorMessage: ({ event }) => event.errorMessage
          })
        },
        KILL_REQUESTED: {
          guard: ({ context }) => context.status === 'active' || context.status === 'standby',
          actions: assign({ status: 'idle', sessionId: null })
        }
      }
    }
  }
})
