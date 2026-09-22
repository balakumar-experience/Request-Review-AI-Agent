import { CheckCircle2 } from 'lucide-react'
import type { ReviewRequest } from '../../types/requestReview'

interface SendSuccessProps {
  request: ReviewRequest
  onViewRequest: () => void
  onSendAnother: () => void
}

export function SendSuccess({ request, onViewRequest, onSendAnother }: SendSuccessProps) {
  return (
    <article className="send-success">
      <p className="send-success__kicker">
        <CheckCircle2 size={18} />
        Review request sent
      </p>

      <div className="send-success__recipient">
        <p className="send-success__name">{request.recipientName}</p>
        <p className="send-success__email">{request.recipientEmail}</p>
      </div>

      <dl className="send-success__meta">
        <div>
          <dt>Status</dt>
          <dd>
            <span className="send-success__status">Awaiting Review</span>
          </dd>
        </div>
      </dl>
      <p className="send-success__sent">Sent just now</p>

      <div className="send-success__actions">
        <button type="button" className="btn" onClick={onViewRequest}>
          View Request
        </button>
        <button type="button" className="btn btn--primary" onClick={onSendAnother}>
          Send Another
        </button>
      </div>
    </article>
  )
}
