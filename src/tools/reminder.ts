import {
  businessRules,
  findRecipient,
  getProfile,
  listRequests,
  updateRequest,
} from '../data/mockData'
import type { EmailDraft, EmailTone, ReviewRequest } from '../types/requestReview'
import { simulateDelay } from './delay'

export interface ReminderCandidate {
  request: ReviewRequest
  eligible: boolean
  reason: string
  elapsedLabel: string
}

export function findReminderCandidates(
  profileId: string,
  recipientName?: string,
): ReminderCandidate[] {
  const query = recipientName?.trim().toLowerCase()
  const requests = listRequests(profileId)
    .filter((request) =>
      query ? request.recipientName.toLowerCase().includes(query) : isPending(request),
    )
    .filter(
      (request, index, all) =>
        all.findIndex(
          (item) => item.recipientEmail.toLowerCase() === request.recipientEmail.toLowerCase(),
        ) === index,
    )

  return requests.map(checkReminderEligibility)
}

export function listPendingRequests(profileId: string): ReviewRequest[] {
  return listRequests(profileId).filter(isPending)
}

export function listReminderReadyRequests(profileId: string): ReviewRequest[] {
  return findReminderCandidates(profileId)
    .filter((candidate) => candidate.eligible)
    .map((candidate) => candidate.request)
}

export function generateReminderEmail(
  request: ReviewRequest,
  tone: EmailTone = 'professional',
): EmailDraft {
  const firstName = request.recipient.firstName || request.recipientName.split(' ')[0]
  const fromLabel = request.email.fromLabel

  if (tone === 'brief') {
    return {
      ...request.email,
      subject: 'A quick reminder',
      body: `Hi ${firstName},\n\nJust following up on my review request. We'd still value your feedback.`,
      tone,
      fromLabel,
    }
  }

  if (tone === 'warm') {
    return {
      ...request.email,
      subject: `${firstName}, a friendly follow-up`,
      body: [
        `Hi ${firstName},`,
        '',
        'Just wanted to follow up on my previous request.',
        "We'd still truly love to hear about your experience.",
        '',
        `Thank you so much,\n${request.profileName}`,
      ].join('\n'),
      tone,
      fromLabel,
    }
  }

  return {
    ...request.email,
    subject: 'Just a quick follow-up',
    body: [
      `Hi ${firstName},`,
      '',
      'Just wanted to follow up on my previous request.',
      "We'd still love to hear about your experience.",
    ].join('\n'),
    tone,
    fromLabel,
  }
}

export function reviseReminderEmail(email: EmailDraft, instruction: string): EmailDraft {
  const normalized = instruction.toLowerCase()
  const requestLike = {
    email,
    recipient: {
      firstName: email.toName.split(' ')[0] ?? email.toName,
    },
    recipientName: email.toName,
    profileName: email.fromName,
  } as ReviewRequest
  if (/warm/.test(normalized)) return generateReminderEmail(requestLike, 'warm')
  if (/short|brief/.test(normalized)) return generateReminderEmail(requestLike, 'brief')

  const revised = generateReminderEmail(requestLike, 'professional')
  if (/subject/.test(normalized)) {
    revised.subject = 'A friendly reminder about your experience'
  }
  return revised
}

export async function sendReminder(
  requestId: string,
  email: EmailDraft,
): Promise<ReviewRequest | null> {
  await simulateDelay(420)
  const now = new Date().toISOString()
  return (
    updateRequest(requestId, (request) => ({
      ...request,
      email,
      subject: email.subject,
      content: email.body,
      lastReminderAt: now,
      reminderCount: (request.reminderCount ?? 0) + 1,
      timeline: [
        ...request.timeline,
        {
          id: `${request.id}-reminder-${Date.now()}`,
          at: now,
          kind: 'reminder_sent',
          label: 'Reminder sent',
        },
      ],
    })) ?? null
  )
}

function checkReminderEligibility(request: ReviewRequest): ReminderCandidate {
  if (request.status === 'reviewed' || request.status === 'review_received') {
    return result(request, false, 'A review has already been received.')
  }
  if (request.status === 'archived') {
    return result(request, false, 'This request is archived.')
  }
  if (!isPending(request)) {
    return result(request, false, 'This request is not awaiting a review.')
  }

  const knownRecipient = findRecipient(request.recipientEmail)
  if (knownRecipient?.unsubscribed) {
    return result(request, false, `${request.recipientName} has unsubscribed.`)
  }

  const lastContact = request.lastReminderAt ?? request.sentAt ?? request.createdAt
  const elapsedHours = Math.floor((Date.now() - new Date(lastContact).getTime()) / 3_600_000)
  if (elapsedHours < businessRules.reminderCooldownHours) {
    const remaining = businessRules.reminderCooldownHours - elapsedHours
    return result(
      request,
      false,
      `The previous request was sent ${formatElapsed(lastContact)}. Please try again in ${remaining} hour${remaining === 1 ? '' : 's'}.`,
    )
  }

  return result(request, true, 'Eligible for a reminder.')
}

function result(
  request: ReviewRequest,
  eligible: boolean,
  reason: string,
): ReminderCandidate {
  return {
    request,
    eligible,
    reason,
    elapsedLabel: formatElapsed(request.lastReminderAt ?? request.sentAt ?? request.createdAt),
  }
}

function isPending(request: ReviewRequest): boolean {
  return request.status === 'sent' || request.status === 'awaiting_review'
}

function formatElapsed(iso: string): string {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000))
  if (hours < 1) return 'less than an hour ago'
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function senderForRequest(request: ReviewRequest): string {
  return getProfile(request.profileId)?.name ?? request.profileName
}
