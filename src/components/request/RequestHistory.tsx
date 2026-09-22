import { Mail, Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { listRequests } from '../../data/mockData'
import type { ReviewRequest } from '../../types/requestReview'
import { EmptyState } from '../common/EmptyState'
import { StatusBadge } from '../common/StatusBadge'
import { formatSentLabel } from './requestDisplay'
import { RequestDetail } from './RequestDetail'

interface RequestHistoryProps {
  profileId?: string
  limit?: number
  title?: string
  showControls?: boolean
  onRequestReview?: () => void
}

export function RequestHistory({
  profileId,
  limit,
  title = 'Request history',
  showControls = false,
  onRequestReview,
}: RequestHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'awaiting' | 'reviewed' | 'reminder' | 'archived'>('all')
  const [source, setSource] = useState<'all' | 'manual' | 'csv'>('all')
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)
  const allRequests = listRequests(profileId)
  const selected = allRequests.find((request) => request.id === selectedId) ?? null
  const requests = allRequests
    .filter((request) => {
      const term = query.trim().toLowerCase()
      const matchesSearch =
        !term ||
        request.recipientName.toLowerCase().includes(term) ||
        request.recipientEmail.toLowerCase().includes(term)
      const matchesSource = source === 'all' || request.source === source
      return matchesSearch && matchesFilter(request, filter) && matchesSource
    })
    .slice(0, limit)

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
        <div>
          <h2>{title}</h2>
          <p>{showControls ? 'Track requests and follow-up activity.' : 'Your latest review activity.'}</p>
        </div>
      </div>
      {showControls ? (
        <div className="history-toolbar">
          <label className="history-search">
            <Search size={15} />
            <input
              type="search"
              value={query}
              placeholder="Search customers or email"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="history-filter">
            <SlidersHorizontal size={15} />
            <select
              value={filter}
              aria-label="Filter requests"
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">All requests</option>
              <option value="awaiting">Awaiting review</option>
              <option value="reviewed">Review received</option>
              <option value="reminder">Reminder sent</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <button
            type="button"
            className="btn history-more-filters"
            aria-expanded={moreFiltersOpen}
            onClick={() => setMoreFiltersOpen((open) => !open)}
          >
            More filters
          </button>
        </div>
      ) : null}
      {showControls && moreFiltersOpen ? (
        <div className="history-advanced">
          <label>
            Source
            <select value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
              <option value="all">All sources</option>
              <option value="manual">Assistant</option>
              <option value="csv">CSV upload</option>
            </select>
          </label>
          <button
            type="button"
            className="history-clear"
            onClick={() => {
              setQuery('')
              setFilter('all')
              setSource('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
      {requests.length === 0 ? (
        <EmptyState
          title={allRequests.length === 0 ? 'No review requests yet' : 'No matching requests'}
          description={
            allRequests.length === 0
              ? "Ask your first customer for a review and we'll help you take it from there."
              : 'Try a different search or filter.'
          }
          actionLabel={allRequests.length === 0 ? 'Request a Review' : undefined}
          onAction={allRequests.length === 0 ? onRequestReview : undefined}
        />
      ) : (
        <div className={showControls ? 'history-table' : 'history-list'}>
          {showControls ? (
            <div className="history-table__head" aria-hidden="true">
              <span>Customer</span>
              <span>Status</span>
              <span>Last activity</span>
              <span>Profile</span>
              <span>Actions</span>
            </div>
          ) : null}
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
                  {request.source === 'csv' ? (
                    <span className="history-card__source">Source: CSV Upload</span>
                  ) : null}
                </span>
                <span className="history-card__status">
                  {request.lastReminderAt ? (
                    <span className="status-badge status-badge--reminder">Reminder Sent</span>
                  ) : (
                    <StatusBadge status={request.status} />
                  )}
                </span>
                <time
                  className="history-card__sent"
                  dateTime={request.lastReminderAt ?? request.sentAt ?? request.createdAt}
                >
                  {activityLabel(request)}
                </time>
                {showControls ? (
                  <>
                    <span className="history-card__profile">{request.profileName}</span>
                    <span className="history-card__action">View</span>
                  </>
                ) : null}
              </button>
            </li>
          ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function matchesFilter(
  request: ReviewRequest,
  filter: 'all' | 'awaiting' | 'reviewed' | 'reminder' | 'archived',
): boolean {
  if (filter === 'all') return true
  if (filter === 'reminder') return Boolean(request.lastReminderAt)
  if (filter === 'reviewed') {
    return request.status === 'reviewed' || request.status === 'review_received'
  }
  if (filter === 'archived') return request.status === 'archived'
  return request.status === 'sent' || request.status === 'awaiting_review'
}

function activityLabel(request: ReviewRequest): string {
  if (request.lastReminderAt) {
    return `Reminder ${formatSentLabel(request.lastReminderAt).replace('Sent ', '').toLowerCase()}`
  }
  if (request.sentAt) return formatSentLabel(request.sentAt)
  return 'Created recently'
}
