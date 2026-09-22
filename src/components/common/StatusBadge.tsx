import type { RequestStatus } from '../../types/requestReview'
import { displayStatus } from '../request/requestDisplay'

interface StatusBadgeProps {
  status: RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone =
    status === 'sent' || status === 'awaiting_review'
      ? 'awaiting_review'
      : status

  return <span className={`status-badge status-badge--${tone}`}>{displayStatus(status)}</span>
}
