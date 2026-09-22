import type { EmailDraft, ReviewRequest } from '../types/requestReview'
import type { ExtractedRecipient, ParsedIntent } from './intentParser'

export const AGENT_STATES = [
  'idle',
  'understanding',
  'missing_information',
  'validating',
  'preparing',
  'preview',
  'awaiting_confirmation',
  'sending',
  'completed',
  'error',
] as const

export type AgentState = (typeof AGENT_STATES)[number]

export type MissingField = 'name' | 'email'

export type ProcessingStepStatus = 'pending' | 'active' | 'done'

export interface ProcessingStep {
  id: string
  label: string
  status: ProcessingStepStatus
}

export interface UnderstandingSummary {
  customerName: string
  email: string
  fromName: string
  fromLabel: string
  status: string
}

export interface UserTextMessage {
  id: string
  role: 'user'
  kind: 'text'
  text: string
}

export interface AssistantTextMessage {
  id: string
  role: 'assistant'
  kind: 'text'
  text: string
  tone: 'default' | 'error' | 'success'
}

export interface ProcessingMessage {
  id: string
  role: 'assistant'
  kind: 'processing'
  steps: ProcessingStep[]
}

export interface UnderstandingMessage {
  id: string
  role: 'assistant'
  kind: 'understanding'
  summary: UnderstandingSummary
  resolved: boolean
}

export type AgentMessage =
  | UserTextMessage
  | AssistantTextMessage
  | ProcessingMessage
  | UnderstandingMessage

export interface AgentSnapshot {
  state: AgentState
  missingFields: MissingField[]
  errorMessage: string | null
  assistantMessage: string | null
  intent: ParsedIntent | null
  recipient: ExtractedRecipient
  profileId: string
  emailDraft: EmailDraft | null
  messages: AgentMessage[]
  composerDraft: string
  readyToPrepare: boolean
  editingWithAi: boolean
  revisingEmail: boolean
  activity: ProcessingStep[]
  sendingSteps: ProcessingStep[]
  sentRequest: ReviewRequest | null
  viewingRequest: boolean
}

export const INITIAL_AGENT_SNAPSHOT: AgentSnapshot = {
  state: 'idle',
  missingFields: [],
  errorMessage: null,
  assistantMessage: null,
  intent: null,
  recipient: {},
  profileId: 'prof-john',
  emailDraft: null,
  messages: [],
  composerDraft: '',
  readyToPrepare: false,
  editingWithAi: false,
  revisingEmail: false,
  activity: [],
  sendingSteps: [],
  sentRequest: null,
  viewingRequest: false,
}

export type AgentEvent =
  | { type: 'USER_MESSAGE' }
  | { type: 'INFORMATION_MISSING'; fields: MissingField[] }
  | { type: 'INFORMATION_COMPLETE' }
  | { type: 'VALIDATION_PASSED' }
  | { type: 'VALIDATION_FAILED'; message: string }
  | { type: 'PREPARATION_COMPLETE' }
  | { type: 'PREPARATION_FAILED'; message: string }
  | { type: 'REQUEST_CONFIRMATION' }
  | { type: 'CONFIRM_SEND' }
  | { type: 'GO_BACK' }
  | { type: 'CANCEL' }
  | { type: 'SEND_SUCCEEDED' }
  | { type: 'SEND_FAILED'; message: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }

export interface AgentStateView {
  title: string
  description: string
  tone: 'neutral' | 'progress' | 'attention' | 'success' | 'danger'
}

export const AGENT_STATE_VIEW: Record<AgentState, AgentStateView> = {
  idle: {
    title: 'Request a review',
    description: 'Tell the assistant who should receive a review request. No form to fill out.',
    tone: 'neutral',
  },
  understanding: {
    title: 'Understanding your request',
    description: 'Reading what you asked for and extracting the customer name and email.',
    tone: 'progress',
  },
  missing_information: {
    title: 'A little more is needed',
    description: 'The assistant needs the missing details before it can continue.',
    tone: 'attention',
  },
  validating: {
    title: 'Validating the request',
    description: 'Checking email format, eligibility, cooldown, and daily limits.',
    tone: 'progress',
  },
  preparing: {
    title: 'Preparing the review request',
    description: 'Putting together the request for the active profile.',
    tone: 'progress',
  },
  preview: {
    title: 'Email preview',
    description: 'Review the generated message. You can still ask for edits in chat.',
    tone: 'neutral',
  },
  awaiting_confirmation: {
    title: 'Ready to send?',
    description: 'Nothing is sent until you explicitly confirm.',
    tone: 'attention',
  },
  sending: {
    title: 'Sending',
    description: 'Simulating delivery of the review request.',
    tone: 'progress',
  },
  completed: {
    title: 'Request sent',
    description: 'The review request was added to history.',
    tone: 'success',
  },
  error: {
    title: 'Couldn’t continue',
    description: 'Something blocked this request. You can retry or start over.',
    tone: 'danger',
  },
}

const NEXT_STATE: Record<AgentState, Partial<Record<AgentEvent['type'], AgentState>>> = {
  idle: {
    USER_MESSAGE: 'understanding',
    RESET: 'idle',
  },
  understanding: {
    INFORMATION_MISSING: 'missing_information',
    INFORMATION_COMPLETE: 'validating',
    CANCEL: 'idle',
    RESET: 'idle',
  },
  missing_information: {
    USER_MESSAGE: 'understanding',
    CANCEL: 'idle',
    RESET: 'idle',
  },
  validating: {
    VALIDATION_PASSED: 'preparing',
    VALIDATION_FAILED: 'error',
    CANCEL: 'idle',
    RESET: 'idle',
  },
  preparing: {
    PREPARATION_COMPLETE: 'preview',
    PREPARATION_FAILED: 'error',
    CANCEL: 'idle',
    RESET: 'idle',
  },
  preview: {
    REQUEST_CONFIRMATION: 'awaiting_confirmation',
    GO_BACK: 'understanding',
    USER_MESSAGE: 'understanding',
    CANCEL: 'idle',
    RESET: 'idle',
  },
  awaiting_confirmation: {
    CONFIRM_SEND: 'sending',
    CANCEL: 'preview',
    RESET: 'idle',
  },
  sending: {
    SEND_SUCCEEDED: 'completed',
    SEND_FAILED: 'error',
  },
  completed: {
    RESET: 'idle',
    USER_MESSAGE: 'understanding',
  },
  error: {
    RETRY: 'understanding',
    USER_MESSAGE: 'understanding',
    RESET: 'idle',
    CANCEL: 'idle',
  },
}

export function canTransition(state: AgentState, eventType: AgentEvent['type']): boolean {
  return NEXT_STATE[state][eventType] !== undefined
}

export function reduceAgentSnapshot(
  snapshot: AgentSnapshot,
  event: AgentEvent,
): AgentSnapshot {
  const nextState = NEXT_STATE[snapshot.state][event.type]
  if (!nextState) {
    return snapshot
  }

  if (event.type === 'RESET') {
    return {
      ...INITIAL_AGENT_SNAPSHOT,
      profileId: snapshot.profileId,
    }
  }

  const base: AgentSnapshot = {
    ...snapshot,
    state: nextState,
    missingFields: [],
    errorMessage: null,
  }

  switch (event.type) {
    case 'INFORMATION_MISSING':
      return { ...base, missingFields: event.fields }
    case 'VALIDATION_FAILED':
    case 'PREPARATION_FAILED':
    case 'SEND_FAILED':
      return { ...base, errorMessage: event.message }
    default:
      return base
  }
}

export function isTerminalAgentState(state: AgentState): boolean {
  return state === 'completed' || state === 'error'
}

const PROCESSING_STATES: AgentState[] = ['understanding', 'validating', 'preparing', 'sending']

/** True while the agent is working and the composer should stay out of the way. */
export function isProcessingAgentState(state: AgentState): boolean {
  return PROCESSING_STATES.includes(state)
}
