import { BellRing, CheckCircle2, Clock3, Sparkles } from 'lucide-react'
import type { AgentActions } from '../../agent/agentSimulator'
import type { AgentSnapshot } from '../../agent/agentStates'
import { StatusBadge } from '../common/StatusBadge'
import { SendingProgress } from '../request/SendingProgress'
import { formatSentLabel } from '../request/requestDisplay'

interface ReminderExperienceProps {
  snapshot: AgentSnapshot
  actions: AgentActions
}

export function ReminderFound({ snapshot, actions }: ReminderExperienceProps) {
  const eligible = snapshot.reminderCandidates.filter((candidate) => candidate.eligible)
  const isBatch = snapshot.reminderCandidates.length > 1

  return (
    <article className="reminder-card">
      <p className="reminder-card__kicker">
        <BellRing size={16} />
        Reminder eligibility
      </p>
      {snapshot.reminderCandidates.length === 0 ? (
        <>
          <h2>No matching request found</h2>
          <p>A review request must exist before a reminder can be sent.</p>
        </>
      ) : isBatch ? (
        <>
          <h2>I found {snapshot.reminderCandidates.length} pending requests</h2>
          <div className="reminder-counts">
            <span><strong>{eligible.length}</strong> eligible</span>
            <span><strong>{snapshot.reminderCandidates.length - eligible.length}</strong> not eligible yet</span>
          </div>
        </>
      ) : (
        <IndividualEligibility candidate={snapshot.reminderCandidates[0]} />
      )}

      <div className="reminder-card__actions">
        <button type="button" className="btn" onClick={() => void actions.reset()}>
          Start over
        </button>
        {eligible.length > 0 ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void actions.previewReminders()}
          >
            {isBatch ? `Review ${eligible.length} Reminders` : 'Preview Reminder'}
          </button>
        ) : null}
      </div>
    </article>
  )
}

function IndividualEligibility({
  candidate,
}: {
  candidate: AgentSnapshot['reminderCandidates'][number]
}) {
  return (
    <>
      <h2>{candidate.request.recipientName}</h2>
      <dl className="reminder-eligibility">
        <div>
          <dt>Last request</dt>
          <dd>{candidate.elapsedLabel}</dd>
        </div>
        <div>
          <dt>Reminder</dt>
          <dd className={candidate.eligible ? 'reminder-ready' : 'reminder-blocked'}>
            {candidate.eligible ? 'Eligible ✓' : 'Not eligible'}
          </dd>
        </div>
      </dl>
      {!candidate.eligible ? <p className="reminder-reason">{candidate.reason}</p> : null}
    </>
  )
}

export function ReminderPreview({ snapshot, actions }: ReminderExperienceProps) {
  return (
    <section className="reminder-preview">
      <header>
        <p className="reminder-card__kicker">Reminder preview</p>
        <h2>
          {snapshot.reminderDrafts.length === 1
            ? 'Review your reminder'
            : `Review ${snapshot.reminderDrafts.length} reminders`}
        </h2>
      </header>
      <div className="reminder-preview__list">
        {snapshot.reminderDrafts.slice(0, 3).map((draft) => (
          <article key={draft.toEmail} className="reminder-email">
            <dl>
              <div><dt>To</dt><dd>{draft.toName}</dd></div>
              <div><dt>Email</dt><dd>{draft.toEmail}</dd></div>
              <div><dt>Subject</dt><dd>{draft.subject}</dd></div>
            </dl>
            <div>
              {draft.body.split('\n').map((line, index) =>
                line ? <p key={index}>{line}</p> : <br key={index} />,
              )}
              <span>Write a Review</span>
            </div>
          </article>
        ))}
      </div>
      <div className="reminder-card__actions">
        <button type="button" className="btn" onClick={() => void actions.editWithAi()}>
          <Sparkles size={15} />
          Edit with AI
        </button>
        <button type="button" className="btn" onClick={() => void actions.reset()}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void actions.acknowledgeReminderPreview()}
        >
          Send {snapshot.reminderDrafts.length === 1 ? 'Reminder' : 'Reminders'}
        </button>
      </div>
    </section>
  )
}

export function ReminderConfirmation({ snapshot, actions }: ReminderExperienceProps) {
  const count = snapshot.reminderDrafts.length
  return (
    <article className="reminder-confirm">
      <p className="reminder-card__kicker">Explicit confirmation required</p>
      <h2>Ready to send</h2>
      <strong>{count} reminder{count === 1 ? '' : 's'}</strong>
      <p>No email will be sent by this prototype.</p>
      <div className="reminder-card__actions">
        <button type="button" className="btn" onClick={() => void actions.cancel()}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void actions.confirmReminderSend()}
        >
          Confirm Send {count === 1 ? 'Reminder' : `${count} Reminders`}
        </button>
      </div>
    </article>
  )
}

export function ReminderSending({ snapshot }: ReminderExperienceProps) {
  return <SendingProgress steps={snapshot.sendingSteps} />
}

export function ReminderCompleted({ snapshot, actions }: ReminderExperienceProps) {
  return (
    <article className="reminder-complete">
      <CheckCircle2 size={34} />
      <p className="reminder-card__kicker">Delivered</p>
      <h2>Reminders sent</h2>
      <strong>
        {snapshot.reminderSentCount} reminder{snapshot.reminderSentCount === 1 ? '' : 's'} sent
      </strong>
      <p>Status: Awaiting Review</p>
      <button type="button" className="btn btn--primary" onClick={() => void actions.reset()}>
        Continue
      </button>
    </article>
  )
}

export function QueryResults({ snapshot, actions }: ReminderExperienceProps) {
  return (
    <section className="query-results">
      <header>
        <h2>{snapshot.queryTitle}</h2>
        <p>{snapshot.queryRequests.length} request{snapshot.queryRequests.length === 1 ? '' : 's'} found</p>
      </header>
      {snapshot.queryRequests.length > 0 ? (
        <ul>
          {snapshot.queryRequests.map((request) => (
            <li key={request.id}>
              <span>
                <strong>{request.recipientName}</strong>
                <small>{request.recipientEmail}</small>
              </span>
              <span className="query-results__date">
                <Clock3 size={13} />
                {request.sentAt ? formatSentLabel(request.sentAt) : 'Not sent'}
              </span>
              <StatusBadge status={request.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="query-results__empty">No requests match this question.</p>
      )}
      <button type="button" className="btn" onClick={() => void actions.reset()}>
        Back to assistant
      </button>
    </section>
  )
}
