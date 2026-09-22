import { DEMO_USERS, toPublicUser, type User } from './mockUsers'

const SESSION_KEY = 'request-review-demo-user'

export function authenticate(email: string, password: string): User | null {
  const normalizedEmail = email.trim().toLowerCase()
  const match = DEMO_USERS.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
  )

  return match ? toPublicUser(match) : null
}

export function readSession(): User | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as Partial<User>
    const user = DEMO_USERS.find((candidate) => candidate.id === parsed.id)
    return user ? toPublicUser(user) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function writeSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
