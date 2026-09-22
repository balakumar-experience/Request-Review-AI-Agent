import { Sparkles } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const from =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/dashboard'

  return (
    <main className="login-page">
      <section className="login-shell">
        <header className="login-brand">
          <span className="login-brand__mark">
            <Sparkles size={20} />
          </span>
          <div>
            <p className="login-brand__name">Request a Review</p>
            <p>AI-powered review requests</p>
          </div>
        </header>

        <LoginForm
          onLogin={(email, password) => {
            const success = auth.login(email, password)
            if (success) {
              navigate(from, { replace: true })
            }
            return success
          }}
        />

        <p className="login-shell__footer">Local prototype · No real messages are sent</p>
      </section>
    </main>
  )
}
