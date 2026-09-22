export interface DemoScenario {
  id: string
  label: string
  utterance: string
  intent?: 'create_request' | 'send_reminder' | 'send_batch_reminders' | 'show_pending' | 'show_reminder_ready'
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
  {
    id: 'reminder',
    label: 'Send reminder',
    utterance: 'Send a reminder to Michael Johnson',
    intent: 'send_reminder',
    firstName: 'Michael',
    lastName: 'Johnson',
  },
  {
    id: 'batch-reminders',
    label: 'Remind everyone',
    utterance: "Send reminders to everyone who hasn't reviewed yet",
    intent: 'send_batch_reminders',
  },
  {
    id: 'pending-requests',
    label: 'Show pending',
    utterance: 'Show my pending review requests',
    intent: 'show_pending',
  },
]

export function normalizeUtterance(value: string): string {
  return value
    .toLowerCase()
    .replace(/[?!]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
