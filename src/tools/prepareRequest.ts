import { getProfile } from '../data/mockData'
import type { Profile, RecipientInput } from '../types/requestReview'
import { simulateDelay } from './delay'

export interface PrepareRequestInput {
  recipient: RecipientInput
  profileId: string
}

export interface PreparedRequest {
  profile: Profile
  recipientName: string
  recipientEmail: string
}

export interface PrepareRequestOutput {
  ok: boolean
  request: PreparedRequest | null
  error: { message: string } | null
}

export async function prepareRequest(
  input: PrepareRequestInput,
): Promise<PrepareRequestOutput> {
  await simulateDelay(260)

  const profile = getProfile(input.profileId)
  if (!profile) {
    return {
      ok: false,
      request: null,
      error: { message: 'No active profile is selected.' },
    }
  }

  const recipientName = input.recipient.name?.trim() ?? ''
  const recipientEmail = input.recipient.email?.trim().toLowerCase() ?? ''

  if (!recipientName || !recipientEmail) {
    return {
      ok: false,
      request: null,
      error: { message: 'A customer name and email are required to prepare the request.' },
    }
  }

  return {
    ok: true,
    request: {
      profile,
      recipientName,
      recipientEmail,
    },
    error: null,
  }
}
