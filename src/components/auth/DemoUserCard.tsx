import { Building2, UserRound } from 'lucide-react'
import type { DemoUser } from '../../auth/mockUsers'

interface DemoUserCardProps {
  user: DemoUser
  selected: boolean
  onSelect: () => void
}

export function DemoUserCard({ user, selected, onSelect }: DemoUserCardProps) {
  const Icon = user.profileType === 'location' ? Building2 : UserRound

  return (
    <button
      type="button"
      className={selected ? 'demo-user demo-user--selected' : 'demo-user'}
      onClick={onSelect}
    >
      <span className="demo-user__icon">
        <Icon size={17} />
      </span>
      <span className="demo-user__body">
        <strong>{user.name}</strong>
        <span>{user.title}</span>
        <small>{user.email} · demo123</small>
      </span>
    </button>
  )
}
