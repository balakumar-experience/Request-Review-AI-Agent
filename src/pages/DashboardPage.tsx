import { ShieldCheck } from 'lucide-react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileFromUser } from '../auth/mockUsers'
import { DashboardHome } from '../components/dashboard/DashboardHome'
import { ActiveProfileCard } from '../components/layout/ActiveProfileCard'
import { AppShell } from '../components/layout/AppShell'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import type { AppSection } from '../components/layout/Sidebar'
import { RequestHistory } from '../components/request/RequestHistory'
import { RequestReviewPage } from './RequestReviewPage'

const SECTION_PATHS: Record<AppSection, string> = {
  home: '/dashboard',
  review: '/dashboard/request-review',
  requests: '/dashboard/requests',
  profile: '/dashboard/profile',
  settings: '/dashboard/settings',
}

export function DashboardPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!auth.user) {
    return <Navigate to="/login" replace />
  }

  const activeSection = sectionFromPath(location.pathname)
  const profile = profileFromUser(auth.user)

  function logout() {
    auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      section={activeSection}
      onSectionChange={(section) => navigate(SECTION_PATHS[section])}
      onHome={() => navigate('/dashboard')}
      user={auth.user}
      onLogout={logout}
    >
      <Routes>
        <Route
          index
          element={
            <DashboardHome
              user={auth.user}
              onRequestReview={() => navigate(SECTION_PATHS.review)}
              onViewRequests={() => navigate(SECTION_PATHS.requests)}
              onOpenProfile={() => navigate(SECTION_PATHS.profile)}
              onOpenSettings={() => navigate(SECTION_PATHS.settings)}
            />
          }
        />
        <Route
          path="request-review"
          element={
            <RequestReviewPage
              profileId={auth.user.profileId}
              onViewRequests={() => navigate(SECTION_PATHS.requests)}
            />
          }
        />
        <Route
          path="requests"
          element={
            <div className="dashboard">
              <DashboardHeader
                title="Requests"
                subtitle="Track requests, reminders, and customer responses."
              />
              <RequestHistory
                profileId={auth.user.profileId}
                title="Request history"
                showControls
                onRequestReview={() => navigate(SECTION_PATHS.review)}
              />
            </div>
          }
        />
        <Route
          path="profile"
          element={
            <div className="dashboard">
              <DashboardHeader
                title="Profile"
                subtitle="The assistant uses this profile when preparing every request."
              />
              <ActiveProfileCard profile={profile} />
              <section className="settings-card">
                <p className="settings-card__kicker">Signed in as</p>
                <h2>{auth.user.email}</h2>
                <p>{auth.user.role} profile · Local demo account</p>
              </section>
            </div>
          }
        />
        <Route
          path="settings"
          element={
            <div className="dashboard">
              <DashboardHeader
                title="Settings"
                subtitle="This prototype keeps all agent behavior local."
              />
              <section className="settings-card">
                <span className="settings-card__icon">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="settings-card__kicker">Demo mode</p>
                  <h2>No external services connected</h2>
                  <p>
                    Authentication, requests, email generation, and delivery are simulated
                    locally. No backend or customer database is used.
                  </p>
                </div>
              </section>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  )
}

function sectionFromPath(pathname: string): AppSection {
  if (pathname.includes('/request-review')) return 'review'
  if (pathname.includes('/requests')) return 'requests'
  if (pathname.includes('/profile')) return 'profile'
  if (pathname.includes('/settings')) return 'settings'
  return 'home'
}
