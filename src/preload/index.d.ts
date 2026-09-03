import type { SwarmDeskApi } from './index'

declare global {
  interface Window {
    swarmdesk: SwarmDeskApi
  }
}
