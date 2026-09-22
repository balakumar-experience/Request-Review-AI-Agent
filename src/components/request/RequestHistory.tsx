import { Mail } from 'lucide-react'
import { useState } from 'react'
import { listRequests } from '../../data/mockData'
import { EmptyState } from '../common/EmptyState'
import { StatusBadge } from '../common/StatusBadge'
import { formatSentLabel } from './requestDisplay'
import { RequestDetail } from './RequestDetail'

interface RequestHistoryProps {
  profileId?: string
  limit?: number
  title?: string
}

export function RequestHistory({
  profileId,
  limit,
  title = 'Request history',
}: RequestHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const requests = listRequests(profileId).slice(0, limit)
  const selected = requests.find((request) => request.id === selectedId) ?? null

  if (selected) {
    return (
      <section className="history">
        <RequestDetail request={selected} onBack={() => setSelectedId(null)} />
      </section>
    )
  }

  return (
    <section className="history">
      <div className="history__header">
        <h2>{title}</h2>
        <p>Stored locally in this demo — no database connected.</p>
      </div>
      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Ask the assistant to prepare a review request and activity will show up here."
        />
      ) : (
        <ul className="history__list">
          {requests.map((request) => (
            <li key={request.id}>
              <button
                type="button"
                className="history-card"
                onClick={() => setSelectedId(request.id)}
              >
                <span className="history-card__icon" aria-hidden="true">
                  <Mail size={16} />
                </span>
                <span className="history-card__body">
                  <span className="history-card__name">{request.recipientName}</span>
                  <span className="history-card__email">{request.recipientEmail}</span>
                  {(request.status === 'sent' || request.status === 'awaiting_review') &&
                  request.sentAt ? (
                    <time className="history-card__sent" dateTime={request.sentAt}>
                      {formatSentLabel(request.sentAt)}
                    </time>
                  ) : null}
                </span>
                <StatusBadge status={request.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
