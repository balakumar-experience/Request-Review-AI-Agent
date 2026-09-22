import { DEMO_SCENARIOS, normalizeUtterance } from '../data/demoScenarios'

export interface ExtractedRecipient {
  firstName?: string
  lastName?: string
  email?: string
}

export type UserIntent =
  | 'create_request'
  | 'send_reminder'
  | 'send_batch_reminders'
  | 'show_pending'
  | 'show_reminder_ready'
  | 'provide_field'
  | 'revise_copy'
  | 'confirm'
  | 'cancel'
  | 'unknown'

export type IntentMissingField = 'name' | 'email'

export interface ParsedIntent {
  intent: UserIntent
  firstName?: string
  lastName?: string
  email?: string
  missingFields: IntentMissingField[]
  utterance: string
  source: 'scenario' | 'heuristic'
  scenarioId?: string
}

interface MatcherScenario {
  id: string
  intent: UserIntent
  firstName?: string
  lastName?: string
  email?: string
  matches: (normalized: string) => boolean
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i

const SCENARIO_MATCHERS: MatcherScenario[] = [
  ...DEMO_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    intent: scenario.intent ?? ('create_request' as const),
    firstName: scenario.firstName,
    lastName: scenario.lastName,
    email: scenario.email,
    matches: (normalized: string) => normalized === normalizeUtterance(scenario.utterance),
  })),
  {
    id: 'alex-cooldown',
    intent: 'create_request',
    firstName: 'Alex',
    lastName: 'Nguyen',
    email: 'cooldown@example.com',
    matches: (normalized) => normalized.includes('cooldown@example.com'),
  },
  {
    id: 'sam-resend-blocked',
    intent: 'create_request',
    firstName: 'Sam',
    lastName: 'Ortiz',
    email: 'resend.blocked@example.com',
    matches: (normalized) => normalized.includes('resend.blocked@example.com'),
  },
]

export function parseIntent(utterance: string): ParsedIntent {
  const trimmed = utterance.trim()
  const normalized = normalizeUtterance(trimmed)
  const scenario = SCENARIO_MATCHERS.find((entry) => entry.matches(normalized))

  if (scenario) {
    return withMissingFields({
      intent: scenario.intent,
      firstName: scenario.firstName,
      lastName: scenario.lastName,
      email: scenario.email,
      utterance: trimmed,
      source: 'scenario',
      scenarioId: scenario.id,
    })
  }

  if (isConfirm(normalized)) {
    return withMissingFields({
      intent: 'confirm',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  if (isCancel(normalized)) {
    return withMissingFields({
      intent: 'cancel',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  if (isRevise(normalized)) {
    return withMissingFields({
      intent: 'revise_copy',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  if (/show .*ready for a reminder|which .*ready for a reminder/.test(normalized)) {
    return withMissingFields({
      intent: 'show_reminder_ready',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  if (/show .*pending review request|show .*pending request/.test(normalized)) {
    return withMissingFields({
      intent: 'show_pending',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  if (/send reminders? to (everyone|all)|remind (everyone|all)/.test(normalized)) {
    return withMissingFields({
      intent: 'send_batch_reminders',
      utterance: trimmed,
      source: 'heuristic',
    })
  }

  const email = extractEmail(trimmed)
  const name = extractName(trimmed)
  const looksLikeReminder = /send (a )?reminder|remind /.test(normalized)
  const looksLikeRequest = /review request|send .*review|request a review/.test(normalized)
  const hasRecipient = Boolean(email || name.firstName)

  let intent: UserIntent = 'unknown'
  if (looksLikeReminder) {
    intent = 'send_reminder'
  } else if (looksLikeRequest) {
    intent = 'create_request'
  } else if (hasRecipient) {
    intent = 'provide_field'
  }

  return withMissingFields({
    intent,
    firstName: name.firstName,
    lastName: name.lastName,
    email,
    utterance: trimmed,
    source: 'heuristic',
  })
}

export function mergeRecipient(
  current: ExtractedRecipient,
  parsed: ParsedIntent,
): ExtractedRecipient {
  return {
    firstName: parsed.firstName ?? current.firstName,
    lastName: parsed.lastName ?? current.lastName,
    email: parsed.email ?? current.email,
  }
}

export function missingRecipientFields(recipient: ExtractedRecipient): IntentMissingField[] {
  const missing: IntentMissingField[] = []
  if (!recipient.firstName && !recipient.lastName) {
    missing.push('name')
  }
  if (!recipient.email) {
    missing.push('email')
  }
  return missing
}

export function recipientDisplayName(recipient: ExtractedRecipient): string {
  return [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
}

export function missingInformationQuestion(recipient: ExtractedRecipient): string {
  const missing = missingRecipientFields(recipient)
  const firstName = recipient.firstName

  if (missing.includes('email') && firstName && !missing.includes('name')) {
    return `What is ${firstName}'s email address?`
  }
  if (missing.includes('name') && missing.includes('email')) {
    return 'Who should receive the review request, and what is their email address?'
  }
  if (missing.includes('name')) {
    return 'What is the customer’s name?'
  }
  if (missing.includes('email')) {
    return 'What email should I send the review request to?'
  }
  return 'Could you share a bit more so I can continue?'
}

function withMissingFields(
  intent: Omit<ParsedIntent, 'missingFields'>,
): ParsedIntent {
  return {
    ...intent,
    missingFields: missingRecipientFields({
      firstName: intent.firstName,
      lastName: intent.lastName,
      email: intent.email,
    }),
  }
}

function extractEmail(utterance: string): string | undefined {
  const valid = utterance.match(EMAIL_PATTERN)?.[0]
  if (valid) {
    return valid.toLowerCase()
  }

  const atToken = utterance.match(/\bat\s+([^\s]+)/i)?.[1]
  if (atToken && !isFiller(atToken)) {
    return atToken
  }

  return undefined
}

function extractName(utterance: string): ExtractedRecipient {
  const sendMatch = utterance.match(
    /send\s+([A-Za-z][A-Za-z'-]*)(?:\s+([A-Za-z][A-Za-z'-]*))?\s+a\s+review/i,
  )
  if (sendMatch) {
    return splitName(sendMatch[1], sendMatch[2])
  }

  const toMatch = utterance.match(
    /(?:to|for)\s+([A-Za-z][A-Za-z'-]*)(?:\s+([A-Za-z][A-Za-z'-]*))?/i,
  )
  if (toMatch) {
    return splitName(toMatch[1], toMatch[2])
  }

  const onlyName = utterance.trim().match(/^([A-Za-z][A-Za-z'-]*)(?:\s+([A-Za-z][A-Za-z'-]*))?$/)
  if (onlyName) {
    return splitName(onlyName[1], onlyName[2])
  }

  return {}
}

function splitName(first?: string, last?: string): ExtractedRecipient {
  const firstName = capitalize(first)
  const lastName = last && !isFiller(last) ? capitalize(last) : undefined
  if (!firstName || isFiller(firstName)) {
    return {}
  }
  return { firstName, lastName }
}

function isFiller(word: string): boolean {
  return /^(a|an|the|to|for|please|review|request|email)$/i.test(word)
}

function capitalize(value?: string): string | undefined {
  if (!value) {
    return undefined
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function isConfirm(normalized: string): boolean {
  return /^(yes|yep|yeah|confirm|send it|looks good|please send)\.?$/.test(normalized)
}

function isCancel(normalized: string): boolean {
  return /^(cancel|never mind|nevermind|stop|start over)\.?$/.test(normalized)
}

function isRevise(normalized: string): boolean {
  return (
    /make (it |the message )?(warmer|shorter|brief|more formal|more professional|professional)/.test(
      normalized,
    ) ||
    /(change|update|rewrite|edit) (the )?(subject|message|email|copy)/.test(normalized) ||
    /^(warmer|shorter|more professional)\.?$/.test(normalized)
  )
}
