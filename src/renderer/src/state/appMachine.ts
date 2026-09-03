import { assign, fromPromise, setup } from 'xstate'
import type { CliDetection } from '../../../shared/types'

/**
 * Top-level screen machine. Mirrors the SwarmDesk design's own turn
 * structure — 01 Login gates 02 Floor Arrival — except "login" here means
 * something real: confirming the claude CLI is on this machine and
 * reachable, not a passkey theatre with no backend.
 */

export type FloorTab = 'live' | 'graph' | 'control'

export interface AppContext {
  cli: CliDetection | null
  activeAgentId: string | null
  activeTab: FloorTab
  searchOpen: boolean
}

export type AppEvent =
  | { type: 'RETRY_CLI' }
  | { type: 'CONNECT' }
  | { type: 'SELECT_AGENT'; agentId: string }
  | { type: 'SET_TAB'; tab: FloorTab }
  | { type: 'TOGGLE_SEARCH' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'BACK_TO_FLOOR' }

export const appMachine = setup({
  types: {
    context: {} as AppContext,
    events: {} as AppEvent
  },
  actors: {
    detectCli: fromPromise<CliDetection>(async () => window.swarmdesk.detectCli())
  }
}).createMachine({
  id: 'app',
  context: {
    cli: null,
    activeAgentId: null,
    activeTab: 'live',
    searchOpen: false
  },
  initial: 'boot',
  states: {
    boot: {
      invoke: {
        src: 'detectCli',
        onDone: [
          {
            guard: ({ event }) => event.output.found,
            target: 'connect',
            actions: assign({ cli: ({ event }) => event.output })
          },
          {
            target: 'cliMissing',
            actions: assign({ cli: ({ event }) => event.output })
          }
        ],
        onError: {
          target: 'cliMissing',
          actions: assign({
            cli: {
              found: false,
              binaryPath: null,
              version: null,
              error: 'Could not run the detection check.'
            }
          })
        }
      }
    },
    cliMissing: {
      on: { RETRY_CLI: 'boot' }
    },
    connect: {
      initial: 'idle',
      states: {
        idle: { on: { CONNECT: 'verifying' } },
        verifying: { after: { 900: 'success' } },
        success: { after: { 850: '#app.floor' } }
      }
    },
    floor: {
      on: {
        SELECT_AGENT: { actions: assign({ activeAgentId: ({ event }) => event.agentId }) },
        SET_TAB: { actions: assign({ activeTab: ({ event }) => event.tab }) },
        TOGGLE_SEARCH: { actions: assign({ searchOpen: ({ context }) => !context.searchOpen }) }
      }
    }
  }
})
