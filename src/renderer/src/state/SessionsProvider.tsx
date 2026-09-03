import { createActor, type ActorRefFrom } from 'xstate'
import { useSelector } from '@xstate/react'
import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import type { AgentProfile, SessionStatus } from '../../../shared/types'
import { sessionMachine, type SessionContext } from './sessionMachine'

type SessionActor = ActorRefFrom<typeof sessionMachine>

interface RosterCounts {
  active: number
  total: number
}

interface SessionsApi {
  getActor: (agentId: string) => SessionActor
  spawn: (agent: AgentProfile) => Promise<void>
  write: (agentId: string, data: string) => void
  resize: (agentId: string, cols: number, rows: number) => void
  kill: (agentId: string) => Promise<void>
  subscribeData: (agentId: string, cb: (chunk: string) => void) => () => void
  subscribeCounts: (cb: () => void) => () => void
  getCounts: () => RosterCounts
}

const SessionsContext = createContext<SessionsApi | null>(null)

export function SessionsProvider({ roster, children }: { roster: AgentProfile[]; children: ReactNode }): JSX.Element {
  const actorsRef = useRef(new Map<string, SessionActor>())
  const sessionToAgentRef = useRef(new Map<string, string>())
  const dataSubsRef = useRef(new Map<string, Set<(chunk: string) => void>>())
  const statusMapRef = useRef(new Map<string, SessionStatus>())
  const countListenersRef = useRef(new Set<() => void>())

  const notifyCounts = (): void => countListenersRef.current.forEach((l) => l())

  // Lazily create one actor per roster agent, keyed by the agent's stable
  // id. This runs during render like a lazy ref initializer: it is guarded
  // by the `has()` check so it stays idempotent under React 18 Strict
  // Mode's double-render, and actors must exist synchronously on first
  // render so children can read a snapshot immediately.
  for (const agent of roster) {
    if (!actorsRef.current.has(agent.id)) {
      const actor = createActor(sessionMachine, { input: { agentId: agent.id } })
      actor.subscribe((snapshot) => {
        statusMapRef.current.set(agent.id, snapshot.context.status)
        notifyCounts()
      })
      actor.start()
      actorsRef.current.set(agent.id, actor)
      statusMapRef.current.set(agent.id, 'idle')
    }
  }

  useEffect(() => {
    const offData = window.swarmdesk.onPtyData(({ sessionId, chunk }) => {
      const agentId = sessionToAgentRef.current.get(sessionId)
      if (!agentId) return
      const subs = dataSubsRef.current.get(agentId)
      subs?.forEach((cb) => cb(chunk))
    })

    const offStatus = window.swarmdesk.onSessionStatus((snapshot) => {
      sessionToAgentRef.current.set(snapshot.sessionId, snapshot.agentId)
      actorsRef.current.get(snapshot.agentId)?.send({ type: 'STATUS', ...snapshot })
    })

    const offExit = window.swarmdesk.onPtyExit(({ sessionId, exitCode }) => {
      const agentId = sessionToAgentRef.current.get(sessionId)
      if (!agentId) return
      const ctx = actorsRef.current.get(agentId)?.getSnapshot().context
      actorsRef.current.get(agentId)?.send({
        type: 'STATUS',
        sessionId,
        status: 'exited',
        startedAt: ctx?.startedAt ?? null,
        exitCode,
        errorMessage: null
      })
    })

    const offError = window.swarmdesk.onPtyError(({ sessionId, message }) => {
      const agentId = sessionToAgentRef.current.get(sessionId)
      if (!agentId) return
      actorsRef.current.get(agentId)?.send({
        type: 'STATUS',
        sessionId,
        status: 'error',
        startedAt: null,
        exitCode: null,
        errorMessage: message
      })
    })

    return () => {
      offData()
      offStatus()
      offExit()
      offError()
    }
  }, [])

  const api = useMemo<SessionsApi>(
    () => ({
      getActor: (agentId) => {
        const actor = actorsRef.current.get(agentId)
        if (!actor) throw new Error(`No session actor for agent "${agentId}"`)
        return actor
      },
      spawn: async (agent) => {
        const actor = actorsRef.current.get(agent.id)
        actor?.send({ type: 'SPAWN_REQUESTED' })
        const args: string[] = []
        if (agent.model) args.push('--model', agent.model)
        if (agent.systemPrompt) args.push('--append-system-prompt', agent.systemPrompt)
        const snapshot = await window.swarmdesk.spawnSession({
          agentId: agent.id,
          cwd: agent.cwd,
          cols: 120,
          rows: 32,
          args
        })
        sessionToAgentRef.current.set(snapshot.sessionId, agent.id)
        actor?.send({ type: 'STATUS', ...snapshot })
      },
      write: (agentId, data) => {
        const sessionId = actorsRef.current.get(agentId)?.getSnapshot().context.sessionId
        if (sessionId) void window.swarmdesk.writeSession(sessionId, data)
      },
      resize: (agentId, cols, rows) => {
        const sessionId = actorsRef.current.get(agentId)?.getSnapshot().context.sessionId
        if (sessionId) void window.swarmdesk.resizeSession(sessionId, cols, rows)
      },
      kill: async (agentId) => {
        const actor = actorsRef.current.get(agentId)
        const sessionId = actor?.getSnapshot().context.sessionId
        actor?.send({ type: 'KILL_REQUESTED' })
        if (sessionId) await window.swarmdesk.killSession(sessionId)
      },
      subscribeData: (agentId, cb) => {
        let set = dataSubsRef.current.get(agentId)
        if (!set) {
          set = new Set()
          dataSubsRef.current.set(agentId, set)
        }
        set.add(cb)
        return () => set?.delete(cb)
      },
      subscribeCounts: (cb) => {
        countListenersRef.current.add(cb)
        return () => countListenersRef.current.delete(cb)
      },
      getCounts: () => {
        let active = 0
        for (const status of statusMapRef.current.values()) {
          if (status === 'active' || status === 'spawning') active += 1
        }
        return { active, total: statusMapRef.current.size }
      }
    }),
    []
  )

  return <SessionsContext.Provider value={api}>{children}</SessionsContext.Provider>
}

export function useSessions(): SessionsApi {
  const ctx = useContext(SessionsContext)
  if (!ctx) throw new Error('useSessions must be used within a SessionsProvider')
  return ctx
}

export function useSessionSnapshot(agentId: string): SessionContext {
  const { getActor } = useSessions()
  const actor = getActor(agentId)
  return useSelector(actor, (s) => s.context)
}

export function useRosterCounts(): RosterCounts {
  const { subscribeCounts, getCounts } = useSessions()
  return useSyncExternalStore(subscribeCounts, getCounts)
}
