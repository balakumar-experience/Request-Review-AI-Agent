import type {
  EmailDraft,
  Profile,
  RequestStatus,
  ReviewRequest,
  TimelineEvent,
  ValidationCode,
} from '../types/requestReview'

export interface MockRecipientRecord {
  email: string
  name: string
  unsubscribed?: boolean
  lastReviewedAt?: string
  lastRequestedAt?: string
  resendAvailable?: boolean
}

export const businessRules = {
  dailyLimit: 3,
  cooldownDays: 7,
  recentlyReviewedDays: 30,
} as const

export const profiles: Profile[] = [
  {
    id: 'prof-john',
    name: 'John Smith',
    kind: 'professional',
    title: 'Mortgage Loan Officer',
  },
  {
    id: 'prof-sarah',
    name: 'Sarah Williams',
    kind: 'professional',
    title: 'Real Estate Agent',
  },
  {
    id: 'loc-austin',
    name: 'Austin Downtown',
    kind: 'location',
    title: 'Branch Location',
  },
]

export const defaultProfileId = 'prof-john'

export const recipients: MockRecipientRecord[] = [
  { email: 'michael@gmail.com', name: 'Michael Johnson' },
  { email: 'sarah@gmail.com', name: 'Sarah Williams' },
  { email: 'david@gmail.com', name: 'David Chen' },
  { email: 'unsubscribed@example.com', name: 'Sarah', unsubscribed: true },
  {
    email: 'reviewed@example.com',
    name: 'David',
    lastReviewedAt: daysAgo(4),
  },
  {
    email: 'reviewed.recently@example.com',
    name: 'Chris Lee',
    lastReviewedAt: daysAgo(12),
  },
  {
    email: 'cooldown@example.com',
    name: 'Alex Nguyen',
    lastRequestedAt: daysAgo(2),
  },
  {
    email: 'resend.blocked@example.com',
    name: 'Sam Ortiz',
    lastRequestedAt: daysAgo(1),
    resendAvailable: false,
  },
]

export const mockStore = {
  profiles,
  recipients,
  requests: [] as ReviewRequest[],
}

seedHistory()

export function getProfile(profileId: string): Profile | undefined {
  return mockStore.profiles.find((profile) => profile.id === profileId)
}

export function findRecipient(email: string): MockRecipientRecord | undefined {
  const normalized = normalizeEmail(email)
  return mockStore.recipients.find((recipient) => recipient.email === normalized)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function countSentToday(profileId: string, now = new Date()): number {
  const day = toDayKey(now)
  return mockStore.requests.filter(
    (request) =>
      !isSeedRequest(request.id) &&
      request.profileId === profileId &&
      isOpenSendStatus(request.status) &&
      request.sentAt !== undefined &&
      toDayKey(new Date(request.sentAt)) === day,
  ).length
}

export function lastSentRequest(
  profileId: string,
  email: string,
): ReviewRequest | undefined {
  const normalized = normalizeEmail(email)
  return mockStore.requests
    .filter(
      (request) =>
        !isSeedRequest(request.id) &&
        request.profileId === profileId &&
        normalizeEmail(request.recipientEmail) === normalized &&
        isOpenSendStatus(request.status) &&
        request.sentAt,
    )
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))[0]
}

export function appendRequest(request: ReviewRequest): ReviewRequest {
  mockStore.requests = [request, ...mockStore.requests]
  return request
}

export function listRequests(profileId?: string): ReviewRequest[] {
  const items = profileId
    ? mockStore.requests.filter((request) => request.profileId === profileId)
    : mockStore.requests

  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getRequest(id: string): ReviewRequest | undefined {
  return mockStore.requests.find((request) => request.id === id)
}

export function isOpenSendStatus(status: RequestStatus): boolean {
  return status === 'sent' || status === 'awaiting_review'
}

function isSeedRequest(id: string): boolean {
  return id.startsWith('req-seed-')
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function seedHistory() {
  const john = profiles[0]
  const michaelSentAt = minutesAgo(2)

  mockStore.requests = [
    mockRequest({
      id: 'req-seed-michael',
      profileId: john.id,
      recipientName: 'Michael Johnson',
      recipientEmail: 'michael@gmail.com',
      status: 'awaiting_review',
      createdAt: michaelSentAt,
      sentAt: michaelSentAt,
      email: seedEmail(john, 'Michael Johnson', 'michael@gmail.com'),
    }),
    mockRequest({
      id: 'req-seed-sarah',
      profileId: john.id,
      recipientName: 'Sarah Williams',
      recipientEmail: 'sarah@gmail.com',
      status: 'reviewed',
      createdAt: daysAgo(8),
      sentAt: daysAgo(12),
      email: seedEmail(john, 'Sarah Williams', 'sarah@gmail.com'),
      timeline: [
        {
          id: 'evt-seed-sarah-created',
          at: daysAgo(12),
          kind: 'created',
          label: 'Request created',
        },
        {
          id: 'evt-seed-sarah-sent',
          at: daysAgo(12),
          kind: 'sent',
          label: 'Review request sent',
        },
        {
          id: 'evt-seed-sarah-reviewed',
          at: daysAgo(8),
          kind: 'reviewed',
          label: 'Customer left a review',
        },
      ],
    }),
    mockRequest({
      id: 'req-seed-david',
      profileId: john.id,
      recipientName: 'David Chen',
      recipientEmail: 'david@gmail.com',
      status: 'archived',
      createdAt: daysAgo(40),
      sentAt: daysAgo(40),
      email: seedEmail(john, 'David Chen', 'david@gmail.com'),
      timeline: [
        {
          id: 'evt-seed-david-created',
          at: daysAgo(40),
          kind: 'created',
          label: 'Request created',
        },
        {
          id: 'evt-seed-david-sent',
          at: daysAgo(40),
          kind: 'sent',
          label: 'Review request sent',
        },
        {
          id: 'evt-seed-david-archived',
          at: daysAgo(21),
          kind: 'archived',
          label: 'Request archived',
        },
      ],
    }),
  ]
}

function seedEmail(profile: Profile, toName: string, toEmail: string): EmailDraft {
  return {
    subject: `How was your experience with ${profile.name}?`,
    body: `Hi ${toName.split(' ')[0]},\n\nWe'd appreciate a quick review.\n\nThank you,\n${profile.name}`,
    tone: 'professional',
    fromName: profile.name,
    fromLabel: profile.title ?? profile.kind,
    toName,
    toEmail,
    ctaLabel: 'Write a Review',
  }
}

function mockRequest(
  input: Pick<
    ReviewRequest,
    | 'id'
    | 'profileId'
    | 'recipientName'
    | 'recipientEmail'
    | 'status'
    | 'email'
    | 'createdAt'
  > & {
    sentAt?: string
    blockReason?: ValidationCode
    timeline?: TimelineEvent[]
  },
): ReviewRequest {
  const status: RequestStatus = input.status
  return {
    ...input,
    timeline: input.timeline ?? [
      {
        id: `${input.id}-created`,
        at: input.createdAt,
        kind: 'created',
        label: 'Request created',
      },
      ...(isOpenSendStatus(status) && input.sentAt
        ? [
            {
              id: `${input.id}-sent`,
              at: input.sentAt,
              kind: 'sent' as const,
              label: 'Review request sent',
            },
          ]
        : []),
    ],
  }
}
