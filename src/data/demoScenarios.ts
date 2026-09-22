export interface DemoScenario {
  id: string
  label: string
  utterance: string
  firstName?: string
  lastName?: string
  email?: string
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'happy-path',
    label: 'Successful flow',
    utterance: 'Send Michael Johnson a review request at michael@gmail.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael@gmail.com',
  },
  {
    id: 'missing-email',
    label: 'Ask for email',
    utterance: 'Send Michael Johnson a review request',
    firstName: 'Michael',
    lastName: 'Johnson',
  },
  {
    id: 'invalid-email',
    label: 'Invalid email',
    utterance: 'Send Michael a review request at invalid-email',
    firstName: 'Michael',
    email: 'invalid-email',
  },
  {
    id: 'unsubscribed',
    label: 'Unsubscribed',
    utterance: 'Send Sarah a review request at unsubscribed@example.com',
    firstName: 'Sarah',
    email: 'unsubscribed@example.com',
  },
  {
    id: 'recent-review',
    label: 'Recent review',
    utterance: 'Send David a review request at reviewed@example.com',
    firstName: 'David',
    email: 'reviewed@example.com',
  },
]

export function normalizeUtterance(value: string): string {
  return value
    .toLowerCase()
    .replace(/[?!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
