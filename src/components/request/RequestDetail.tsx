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
      <header className="request-detail__header">
        <div>
          <p className="request-detail__kicker">Review request</p>
          <h2 className="request-detail__name">{request.recipientName}</h2>
          <p className="request-detail__email">{request.recipientEmail}</p>
        </div>
        <StatusBadge status={request.status} />
      </header>

      <dl className="request-detail__meta">
        {request.sentAt ? (
          <div>
            <dt>Sent</dt>
            <dd>{formatSentLabel(request.sentAt).replace(/^Sent /, '')}</dd>
          </div>
        ) : null}
        <div>
          <dt>Source</dt>
          <dd>{request.source === 'csv' ? 'CSV Upload' : 'Individual request'}</dd>
        </div>
      </dl>

      {request.timeline.length > 0 ? (
        <section className="request-detail__activity">
          <h3>Activity</h3>
          <ol className="request-detail__timeline">
            {request.timeline.map((event) => (
              <li key={event.id}>
                <span>{event.label}</span>
                <time dateTime={event.at}>
                  {new Intl.DateTimeFormat('en', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(new Date(event.at))}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="request-detail__email-preview">
        <p className="request-detail__email-label">Email preview</p>
        <h3>{request.email.subject}</h3>
        <div className="request-detail__body">
          {request.email.body.split('\n').map((line, index) =>
            line ? <p key={index}>{line}</p> : <p key={index}>&nbsp;</p>,
          )}
        </div>
      </section>

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
