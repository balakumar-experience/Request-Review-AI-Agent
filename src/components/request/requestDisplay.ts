import type { RequestStatus } from '../../types/requestReview'

export function displayStatus(status: RequestStatus): string {
  switch (status) {
    case 'sent':
    case 'awaiting_review':
      return 'Awaiting Review'
    case 'reviewed':
      return 'Reviewed'
    case 'archived':
      return 'Archived'
    case 'draft':
      return 'Draft'
    case 'queued':
      return 'Queued'
    case 'blocked':
      return 'Blocked'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

export function formatSentLabel(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.max(0, Math.round(deltaMs / 60000))

  if (minutes < 1) {
    return 'Sent just now'
  }
  if (minutes === 1) {
    return 'Sent 1 minute ago'
  }
  if (minutes < 60) {
    return `Sent ${minutes} minutes ago`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? 'Sent 1 hour ago' : `Sent ${hours} hours ago`
  }

  const days = Math.round(hours / 24)
  if (days === 1) {
    return 'Sent 1 day ago'
  }
  return `Sent ${days} days ago`
}
