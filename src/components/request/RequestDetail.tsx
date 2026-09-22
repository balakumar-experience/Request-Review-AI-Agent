import { ArrowLeft } from 'lucide-react'
import type { ReviewRequest } from '../../types/requestReview'
import { StatusBadge } from '../common/StatusBadge'
import { formatSentLabel } from './requestDisplay'

interface RequestDetailProps {
  request: ReviewRequest
  onBack: () => void
  onSendAnother?: () => void
}

export function RequestDetail({ request, onBack, onSendAnother }: RequestDetailProps) {
  return (
    <article className="request-detail">
      <p className="request-detail__kicker">Review request</p>
      <h2 className="request-detail__name">{request.recipientName}</h2>
      <p className="request-detail__email">{request.recipientEmail}</p>

      <dl className="request-detail__meta">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={request.status} />
          </dd>
        </div>
        {request.sentAt ? (
          <div>
            <dt>Sent</dt>
            <dd>{formatSentLabel(request.sentAt).replace(/^Sent /, '')}</dd>
          </div>
        ) : null}
        <div>
          <dt>Subject</dt>
          <dd>{request.email.subject}</dd>
        </div>
      </dl>

      <div className="request-detail__body">
        {request.email.body.split('\n').map((line, index) =>
          line ? <p key={index}>{line}</p> : <p key={index}>&nbsp;</p>,
        )}
      </div>

      {request.timeline.length > 0 ? (
        <ol className="request-detail__timeline">
          {request.timeline.map((event) => (
            <li key={event.id}>{event.label}</li>
          ))}
        </ol>
      ) : null}

      <div className="send-success__actions">
        <button type="button" className="btn" onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </button>
        {onSendAnother ? (
          <button type="button" className="btn btn--primary" onClick={onSendAnother}>
            Send Another
          </button>
        ) : null}
      </div>
    </article>
  )
}
