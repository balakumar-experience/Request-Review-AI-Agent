import type { ReactNode } from 'react'
import type { User } from '../../auth/mockUsers'
import { Sidebar, type AppSection } from './Sidebar'

interface AppShellProps {
  section?: AppSection
  onSectionChange: (section: AppSection) => void
  onHome: () => void
  user: User
  onLogout: () => void
  children?: ReactNode
}

export function AppShell({
  section,
  onSectionChange,
  onHome,
  user,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar
        active={section}
        onSelect={onSectionChange}
        onHome={onHome}
        user={user}
        onLogout={onLogout}
      />
      <div className="app-main">{children}</div>
    </div>
  )
}
