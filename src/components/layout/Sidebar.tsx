import { Inbox, LogOut, Sparkles, UserRound, Settings } from 'lucide-react'
import type { User } from '../../auth/mockUsers'

export type AppSection = 'home' | 'review' | 'requests' | 'profile' | 'settings'

interface SidebarProps {
  active?: AppSection
  onSelect: (section: AppSection) => void
  onHome: () => void
  user: User
  onLogout: () => void
}

const NAV: Array<{ id: AppSection; label: string; icon: typeof Sparkles }> = [
  { id: 'review', label: 'Request a Review', icon: Sparkles },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ active, onSelect, onHome, user, onLogout }: SidebarProps) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return (
    <aside className="sidebar">
      <button type="button" className="sidebar__brand" onClick={onHome}>
        <span className="sidebar__mark">
          <Sparkles size={16} />
        </span>
        <div>
          <p className="sidebar__product">Review Agent</p>
          <p className="sidebar__product-sub">Request a Review</p>
        </div>
      </button>

      <nav className="sidebar__nav" aria-label="Main">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'sidebar__item sidebar__item--active' : 'sidebar__item'}
              onClick={() => onSelect(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-user">
        <span className="sidebar-user__avatar">{initials}</span>
        <span className="sidebar-user__identity">
          <strong>{user.name}</strong>
          <small>{user.title}</small>
        </span>
        <button
          type="button"
          className="sidebar-user__logout"
          onClick={onLogout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
