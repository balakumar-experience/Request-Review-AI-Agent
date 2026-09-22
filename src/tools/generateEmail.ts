import type { EmailDraft, EmailTone, Profile } from '../types/requestReview'
import { simulateDelay } from './delay'

export interface GenerateEmailInput {
  profile: Profile
  recipientName: string
  recipientEmail: string
  tone?: EmailTone
}

export interface GenerateEmailOutput {
  ok: boolean
  email: EmailDraft | null
  error: { message: string } | null
}

export interface ReviseEmailInput {
  email: EmailDraft
  instruction: string
  profile: Profile
  recipientName: string
  recipientEmail: string
}

export async function generateEmail(
  input: GenerateEmailInput,
): Promise<GenerateEmailOutput> {
  await simulateDelay(360)

  const recipientName = input.recipientName.trim()
  const recipientEmail = input.recipientEmail.trim().toLowerCase()

  if (!recipientName || !recipientEmail) {
    return {
      ok: false,
      email: null,
      error: { message: 'Name and email are required to generate a review email.' },
    }
  }

  const tone = input.tone ?? 'professional'

  return {
    ok: true,
    email: buildDraft(input.profile, recipientName, recipientEmail, tone),
    error: null,
  }
}

export async function reviseEmail(
  input: ReviseEmailInput,
): Promise<GenerateEmailOutput> {
  await simulateDelay(420)

  const instruction = input.instruction.toLowerCase()
  let tone: EmailTone = input.email.tone

  if (/warm/.test(instruction)) {
    tone = 'warm'
  } else if (/short|brief/.test(instruction)) {
    tone = 'brief'
  } else if (/formal|professional/.test(instruction)) {
    tone = 'professional'
  }

  const next = buildDraft(input.profile, input.recipientName, input.recipientEmail, tone)

  if (/subject/.test(instruction)) {
    next.subject = nextSubject(input.email.subject, input.profile, input.recipientName, tone)
  }

  if (next.subject === input.email.subject && next.body === input.email.body) {
    next.subject = nextSubject(input.email.subject, input.profile, input.recipientName, tone)
  }

  return {
    ok: true,
    email: next,
    error: null,
  }
}

function buildDraft(
  profile: Profile,
  recipientName: string,
  recipientEmail: string,
  tone: EmailTone,
): EmailDraft {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  const fromLabel = profile.title ?? (profile.kind === 'location' ? 'Location' : 'Professional')

  return {
    subject: subjectFor(profile, firstName, tone),
    body: bodyFor(profile, firstName, tone),
    tone,
    fromName: profile.name,
    fromLabel,
    toName: recipientName,
    toEmail: recipientEmail,
    ctaLabel: 'Write a Review',
  }
}

function subjectFor(profile: Profile, firstName: string, tone: EmailTone): string {
  if (tone === 'brief') {
    return `Quick review for ${profile.name}?`
  }
  if (tone === 'warm') {
    return `${firstName}, we'd truly value your thoughts`
  }
  return "We'd love to hear about your experience"
}

function bodyFor(profile: Profile, firstName: string, tone: EmailTone): string {
  const withName =
    profile.kind === 'location' ? profile.name : (profile.name.split(' ')[0] ?? profile.name)

  if (tone === 'brief') {
    return [`Hi ${firstName},`, '', `Could you leave a quick review for ${profile.name}?`].join('\n')
  }

  if (tone === 'warm') {
    return [
      `Hi ${firstName},`,
      '',
      `We'd be so grateful to hear about your experience`,
      `with ${withName}.`,
      '',
      'Your feedback means a lot to us — thank you so much.',
    ].join('\n')
  }

  return [
    `Hi ${firstName},`,
    '',
    `We'd love to hear about your experience`,
    `with ${withName}.`,
    '',
    'Your feedback means a lot to us.',
  ].join('\n')
}

function nextSubject(
  current: string,
  profile: Profile,
  recipientName: string,
  tone: EmailTone,
): string {
  const firstName = recipientName.split(' ')[0] ?? recipientName
  const options = [
    "We'd love to hear about your experience",
    `${firstName}, we'd truly value your thoughts`,
    `Quick review for ${profile.name}?`,
    `Could you share how things went with ${profile.name.split(' ')[0] ?? profile.name}?`,
    `A brief request for your feedback`,
    subjectFor(profile, firstName, tone),
  ].filter((value, index, list) => list.indexOf(value) === index)

  const currentIndex = options.indexOf(current)
  return options[(currentIndex + 1) % options.length]
}
