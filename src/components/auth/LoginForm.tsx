import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { DEMO_USERS, type DemoUser } from '../../auth/mockUsers'
import { DemoUserCard } from './DemoUserCard'

interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function selectUser(user: DemoUser) {
    setSelectedId(user.id)
    setEmail(user.email)
    setPassword(user.password)
    setError(null)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onLogin(email, password)) {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="login-card">
      <div className="login-card__heading">
        <h1>Welcome back</h1>
        <p>Sign in to start an AI-assisted review request.</p>
      </div>

      <form className="login-form" onSubmit={submit}>
        <label className="login-field">
          <span>Email</span>
          <span className="login-field__control">
            <Mail size={17} />
            <input
              type="email"
              autoComplete="username"
              value={email}
              placeholder="you@example.com"
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
              }}
            />
          </span>
        </label>

        <label className="login-field">
          <span className="login-field__label">
            Password
            <button
              type="button"
              className="login-form__forgot"
              onClick={() => setError('This demo uses the passwords shown on each user card.')}
            >
              Forgot password?
            </button>
          </span>
          <span className="login-field__control">
            <LockKeyhole size={17} />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder="Enter password"
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
            />
          </span>
        </label>

        {error ? (
          <p className="login-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn--primary login-form__submit"
          disabled={!email.trim() || !password}
        >
          Sign In
          <ArrowRight size={17} />
        </button>
      </form>

      <div className="login-card__divider">
        <span>Demo Users</span>
      </div>

      <div className="demo-users">
        {DEMO_USERS.map((user) => (
          <DemoUserCard
            key={user.id}
            user={user}
            selected={selectedId === user.id}
            onSelect={() => selectUser(user)}
          />
        ))}
      </div>

      <p className="login-card__note">Select a demo user to fill the credentials automatically.</p>
    </div>
  )
}
