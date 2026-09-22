export type ProfileKind = 'professional' | 'location'

export interface Profile {
  id: string
  name: string
  kind: ProfileKind
  title?: string
}

export interface RecipientInput {
  name?: string
  email?: string
}

export type EmailTone = 'professional' | 'warm' | 'brief'

export interface EmailDraft {
  subject: string
  body: string
  tone: EmailTone
  fromName: string
  fromLabel: string
  toName: string
  toEmail: string
  ctaLabel: string
}

export type RequestStatus =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'awaiting_review'
  | 'review_received'
  | 'reviewed'
  | 'archived'
  | 'blocked'
  | 'failed'

export type RequestSource = 'manual' | 'csv'

export type ValidationCode =
  | 'missing_name'
  | 'missing_email'
  | 'invalid_email'
  | 'unsubscribed'
  | 'recently_reviewed'
  | 'cooldown'
  | 'daily_limit'
  | 'resend_unavailable'

export interface TimelineEvent {
  id: string
  at: string
  kind:
    | 'created'
    | 'validated'
    | 'previewed'
    | 'sent'
    | 'reminder_sent'
    | 'blocked'
    | 'revised'
    | 'reviewed'
    | 'archived'
  label: string
}

export type RequestActivity =
  | 'request_sent'
  | 'reminder_sent'
  | 'review_received'
  | 'archived'

export interface ReviewRequest {
  id: string
  recipient: {
    firstName: string
    lastName: string
    email: string
  }
  profileId: string
  profileName: string
  recipientName: string
  recipientEmail: string
  subject: string
  content: string
  source: RequestSource
  status: RequestStatus
  blockReason?: ValidationCode
  email: EmailDraft
  createdAt: string
  sentAt?: string
  lastReminderAt?: string
  reminderCount?: number
  timeline: TimelineEvent[]
}

export interface ValidationResult {
  ok: boolean
  code?: ValidationCode
  message: string
  retryable: boolean
}
