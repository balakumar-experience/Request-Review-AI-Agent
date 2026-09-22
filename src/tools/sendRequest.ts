import { appendRequest, getProfile } from '../data/mockData'
import type { EmailDraft, ReviewRequest, TimelineEvent } from '../types/requestReview'
import { simulateDelay } from './delay'
import { validateRecipient } from './validateRecipient'

export interface SendRequestInput {
  profileId: string
  email: EmailDraft
}

export interface SendRequestOutput {
  ok: boolean
  request: ReviewRequest | null
  error: { message: string } | null
}

export async function sendRequest(
  input: SendRequestInput,
): Promise<SendRequestOutput> {
  await simulateDelay(420)

  const profile = getProfile(input.profileId)
  if (!profile) {
    return {
      ok: false,
      request: null,
      error: { message: 'No active profile is selected.' },
    }
  }

  const eligibility = await validateRecipient({
    profileId: input.profileId,
    recipient: {
      name: input.email.toName,
      email: input.email.toEmail,
    },
  })

  const now = new Date().toISOString()
  const id = `req-${Date.now()}`

  if (!eligibility.ok) {
    const blocked = createRequest({
      id,
      profileId: input.profileId,
      email: input.email,
      status: 'blocked',
      blockReason: eligibility.validation.code,
      createdAt: now,
      timeline: [
        event(`${id}-created`, now, 'created', 'Request created'),
        event(
          `${id}-blocked`,
          now,
          'blocked',
          eligibility.validation.message,
        ),
      ],
    })

    return {
      ok: false,
      request: blocked,
      error: { message: eligibility.validation.message },
    }
  }

  const sent = appendRequest(
    createRequest({
      id,
      profileId: input.profileId,
      email: input.email,
      status: 'awaiting_review',
      createdAt: now,
      sentAt: now,
      timeline: [
        event(`${id}-created`, now, 'created', 'Request created'),
        event(`${id}-validated`, now, 'validated', 'Recipient validated'),
        event(`${id}-previewed`, now, 'previewed', 'Email preview confirmed'),
        event(`${id}-sent`, now, 'sent', 'Review request sent'),
      ],
    }),
  )

  return {
    ok: true,
    request: sent,
    error: null,
  }
}

function createRequest(
  input: Pick<
    ReviewRequest,
    'id' | 'profileId' | 'email' | 'status' | 'createdAt' | 'timeline'
  > &
    Partial<Pick<ReviewRequest, 'sentAt' | 'blockReason'>>,
): ReviewRequest {
  return {
    id: input.id,
    profileId: input.profileId,
    recipientName: input.email.toName,
    recipientEmail: input.email.toEmail,
    status: input.status,
    blockReason: input.blockReason,
    email: input.email,
    createdAt: input.createdAt,
    sentAt: input.sentAt,
    timeline: input.timeline,
  }
}

function event(
  id: string,
  at: string,
  kind: TimelineEvent['kind'],
  label: string,
): TimelineEvent {
  return { id, at, kind, label }
}
