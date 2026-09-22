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
  | 'reviewed'
  | 'archived'
  | 'blocked'
  | 'failed'

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
  kind: 'created' | 'validated' | 'previewed' | 'sent' | 'blocked' | 'revised' | 'reviewed' | 'archived'
  label: string
}

export interface ReviewRequest {
  id: string
  profileId: string
  recipientName: string
  recipientEmail: string
  status: RequestStatus
  blockReason?: ValidationCode
  email: EmailDraft
  createdAt: string
  sentAt?: string
  timeline: TimelineEvent[]
}

export interface ValidationResult {
  ok: boolean
  code?: ValidationCode
  message: string
  retryable: boolean
}
