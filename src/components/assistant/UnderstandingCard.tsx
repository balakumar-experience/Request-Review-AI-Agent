import { Sparkles } from 'lucide-react'
import type { UnderstandingSummary } from '../../agent/agentStates'

interface UnderstandingCardProps {
  summary: UnderstandingSummary
  interactive: boolean
  onEdit: () => void
  onPrepare: () => void
}

export function UnderstandingCard({
  summary,
  interactive,
  onEdit,
  onPrepare,
}: UnderstandingCardProps) {
  return (
    <article className="understood">
      <p className="understood__title">
        <Sparkles size={16} />
        I understood
      </p>

      <dl className="understood__fields">
        <div>
          <dt>Customer</dt>
          <dd>{summary.customerName}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{summary.email}</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>
            {summary.fromName}
            <span className="understood__sub">{summary.fromLabel}</span>
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className="understood__status">{summary.status}</span>
          </dd>
        </div>
      </dl>

      {interactive ? (
        <div className="understood__actions">
          <button type="button" className="btn" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn btn--primary" onClick={onPrepare}>
            Prepare Request
          </button>
        </div>
      ) : null}
    </article>
  )
}
