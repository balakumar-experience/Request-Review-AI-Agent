import { BadgeCheck } from 'lucide-react'
import type { Profile } from '../../types/requestReview'

interface ActiveProfileCardProps {
  profile: Profile
}

export function ActiveProfileCard({ profile }: ActiveProfileCardProps) {
  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <section className="profile-card" aria-label="Active profile">
      <div className="profile-card__avatar">{initials}</div>
      <div className="profile-card__body">
        <p className="profile-card__kicker">
          <BadgeCheck size={14} />
          Active profile
        </p>
        <h2>{profile.name}</h2>
        <p className="profile-card__meta">
          {profile.kind === 'professional' ? 'Professional' : 'Location'}
          {profile.title ? ` · ${profile.title}` : ''}
        </p>
      </div>
    </section>
  )
}
