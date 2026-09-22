import {
  businessRules,
  daysBetween,
  findRecipient,
  lastSentRequest,
  countSentToday,
  normalizeEmail,
} from '../data/mockData'
import type { RecipientInput, ValidationCode, ValidationResult } from '../types/requestReview'
import { simulateDelay } from './delay'

export interface ValidateRecipientInput {
  recipient: RecipientInput
  profileId: string
}

export interface ValidateRecipientOutput {
  ok: boolean
  recipient: {
    name: string
    email: string
  } | null
  validation: ValidationResult
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function validateRecipient(
  input: ValidateRecipientInput,
): Promise<ValidateRecipientOutput> {
  await simulateDelay(280)

  const name = input.recipient.name?.trim() ?? ''
  const email = input.recipient.email?.trim() ?? ''

  if (!name) {
    return fail('missing_name', 'A customer name is needed before sending.', true)
  }

  if (!email) {
    return fail('missing_email', `Sure. What is ${name.split(' ')[0]}'s email address?`, true)
  }

  if (!EMAIL_PATTERN.test(email)) {
    return fail('invalid_email', 'That email address doesn’t look valid.', true)
  }

  const normalizedEmail = normalizeEmail(email)
  const known = findRecipient(normalizedEmail)
  const now = new Date()

  if (known?.unsubscribed) {
    return fail(
      'unsubscribed',
      `${known.name} has unsubscribed and cannot receive a review request.`,
      false,
      name,
      normalizedEmail,
    )
  }

  if (known?.resendAvailable === false) {
    return fail(
      'resend_unavailable',
      `A request was already sent to ${known.name}, and resend is not available.`,
      false,
      name,
      normalizedEmail,
    )
  }

  if (known?.lastReviewedAt) {
    const reviewedDays = daysBetween(new Date(known.lastReviewedAt), now)
    if (reviewedDays < businessRules.recentlyReviewedDays) {
      return fail(
        'recently_reviewed',
        `${known.name} already left a review ${reviewedDays} day${reviewedDays === 1 ? '' : 's'} ago.`,
        false,
        name,
        normalizedEmail,
      )
    }
  }

  const previous = lastSentRequest(input.profileId, normalizedEmail)
  const lastRequestedAt = previous?.sentAt ?? known?.lastRequestedAt
  if (lastRequestedAt) {
    const waitDays = daysBetween(new Date(lastRequestedAt), now)
    if (waitDays < businessRules.cooldownDays) {
      const remaining = businessRules.cooldownDays - waitDays
      return fail(
        'cooldown',
        `A request was sent recently. Try again in ${remaining} day${remaining === 1 ? '' : 's'}.`,
        false,
        name,
        normalizedEmail,
      )
    }
  }

  const sentToday = countSentToday(input.profileId, now)
  if (sentToday >= businessRules.dailyLimit) {
    return fail(
      'daily_limit',
      `This profile has reached today’s limit of ${businessRules.dailyLimit} review requests.`,
      false,
      name,
      normalizedEmail,
    )
  }

  return {
    ok: true,
    recipient: { name, email: normalizedEmail },
    validation: {
      ok: true,
      message: 'Recipient is eligible for a review request.',
      retryable: false,
    },
  }
}

function fail(
  code: ValidationCode,
  message: string,
  retryable: boolean,
  name?: string,
  email?: string,
): ValidateRecipientOutput {
  return {
    ok: false,
    recipient: name && email ? { name, email } : null,
    validation: {
      ok: false,
      code,
      message,
      retryable,
    },
  }
}
