import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Inbox size={18} />
      </span>
      <p className="empty-state__title">{title}</p>
      <p>{description}</p>
    </div>
  )
}
