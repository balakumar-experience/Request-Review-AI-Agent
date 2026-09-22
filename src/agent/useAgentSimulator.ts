import { useMemo, useState, useSyncExternalStore } from 'react'
import { createAgentSimulator, type AgentActions, type AgentSimulator } from './agentSimulator'
import type { AgentSnapshot } from './agentStates'

export interface AgentSession extends AgentActions {
  snapshot: AgentSnapshot
}

export function useAgentSimulator(profileId?: string): AgentSession {
  const [simulator] = useState<AgentSimulator>(() => createAgentSimulator(profileId))
  const snapshot = useSyncExternalStore(
    simulator.subscribe,
    simulator.getSnapshot,
    simulator.getSnapshot,
  )

  return useMemo(
    () => ({
      snapshot,
      sendUserMessage: simulator.sendUserMessage,
      prepareRequest: simulator.prepareRequest,
      editRequest: simulator.editRequest,
      editWithAi: simulator.editWithAi,
      goBack: simulator.goBack,
      acknowledgePreview: simulator.acknowledgePreview,
      confirmSend: simulator.confirmSend,
      viewSentRequest: simulator.viewSentRequest,
      closeSentRequest: simulator.closeSentRequest,
      cancel: simulator.cancel,
      retry: simulator.retry,
      reset: simulator.reset,
      loadDemoUtterance: simulator.loadDemoUtterance,
    }),
    [simulator, snapshot],
  )
}
