import type { ReactElement } from 'react'
import type { AgentActions } from '../../agent/agentSimulator'
import { type AgentSnapshot, type AgentState } from '../../agent/agentStates'
import { ConfirmSend } from '../request/ConfirmSend'
import { EmailPreview } from '../request/EmailPreview'
import { RequestDetail } from '../request/RequestDetail'
import { SendingProgress } from '../request/SendingProgress'
import { SendSuccess } from '../request/SendSuccess'
import {
  QueryResults,
  ReminderCompleted,
  ReminderConfirmation,
  ReminderFound,
  ReminderPreview,
  ReminderSending,
} from './ReminderExperience'

interface AgentExperienceProps {
  snapshot: AgentSnapshot
  actions: AgentActions
}

interface StateViewProps {
  snapshot: AgentSnapshot
  actions: AgentActions
}

function NoActions() {
  return <></>
}

function PreviewExperience({ snapshot, actions }: StateViewProps) {
  if (!snapshot.emailDraft) {
    return <></>
  }

  return (
    <EmailPreview
      email={snapshot.emailDraft}
      busy={snapshot.revisingEmail}
      onEditWithAi={() => void actions.editWithAi()}
      onGoBack={() => void actions.goBack()}
      onSend={() => void actions.acknowledgePreview()}
    />
  )
}

function AwaitingConfirmationExperience({ snapshot, actions }: StateViewProps) {
  if (!snapshot.emailDraft) {
    return <></>
  }

  return (
    <ConfirmSend
      email={snapshot.emailDraft}
      onCancel={() => void actions.cancel()}
      onConfirm={() => void actions.confirmSend()}
    />
  )
}

function SendingExperience({ snapshot }: StateViewProps) {
  return <SendingProgress steps={snapshot.sendingSteps} />
}

function CompletedExperience({ snapshot, actions }: StateViewProps) {
  if (!snapshot.sentRequest) {
    return <></>
  }

  if (snapshot.viewingRequest) {
    return (
      <RequestDetail
        request={snapshot.sentRequest}
        onBack={() => void actions.closeSentRequest()}
        onSendAnother={() => void actions.reset()}
      />
    )
  }

  return (
    <SendSuccess
      request={snapshot.sentRequest}
      onViewRequest={() => void actions.viewSentRequest()}
      onSendAnother={() => void actions.reset()}
    />
  )
}

function ErrorExperience({ actions }: StateViewProps) {
  return (
    <div className="agent-actions">
      <button type="button" className="btn btn--primary" onClick={() => void actions.retry()}>
        Retry
      </button>
      <button type="button" className="btn" onClick={() => void actions.reset()}>
        Start over
      </button>
    </div>
  )
}

const STATE_EXPERIENCES: Record<AgentState, (props: StateViewProps) => ReactElement> = {
  idle: NoActions,
  understanding: NoActions,
  missing_information: NoActions,
  validating: NoActions,
  preparing: NoActions,
  preview: PreviewExperience,
  awaiting_confirmation: AwaitingConfirmationExperience,
  sending: SendingExperience,
  completed: CompletedExperience,
  reminder_found: ReminderFound,
  reminder_preview: ReminderPreview,
  reminder_confirmation: ReminderConfirmation,
  reminder_sending: ReminderSending,
  reminder_completed: ReminderCompleted,
  query_results: QueryResults,
  error: ErrorExperience,
}

export function AgentExperience({ snapshot, actions }: AgentExperienceProps) {
  const Experience = STATE_EXPERIENCES[snapshot.state]

  return (
    <div className="agent-experience" data-agent-state={snapshot.state}>
      <Experience snapshot={snapshot} actions={actions} />
    </div>
  )
}
