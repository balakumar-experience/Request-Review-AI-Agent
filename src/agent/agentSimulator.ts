import { defaultProfileId, getProfile } from '../data/mockData'
import type { EmailTone, RecipientInput } from '../types/requestReview'
import { simulateDelay } from '../tools/delay'
import { generateEmail, reviseEmail } from '../tools/generateEmail'
import { prepareRequest as prepareRequestTool } from '../tools/prepareRequest'
import { sendRequest } from '../tools/sendRequest'
import {
  findReminderCandidates,
  generateReminderEmail,
  listPendingRequests,
  listReminderReadyRequests,
  reviseReminderEmail,
  sendReminder,
} from '../tools/reminder'
import { validateRecipient } from '../tools/validateRecipient'
import {
  createActivity,
  createSendingSteps,
  setActivityStep,
  type ActivityStepId,
  type SendingStepId,
} from './activity'
import {
  INITIAL_AGENT_SNAPSHOT,
  reduceAgentSnapshot,
  type AgentEvent,
  type AgentMessage,
  type AgentSnapshot,
  type MissingField,
  type ProcessingStep,
  type UnderstandingSummary,
} from './agentStates'
import {
  mergeRecipient,
  missingInformationQuestion,
  missingRecipientFields,
  parseIntent,
  recipientDisplayName,
  type ExtractedRecipient,
  type ParsedIntent,
} from './intentParser'

export interface AgentActions {
  sendUserMessage(text: string): Promise<void>
  prepareRequest(): Promise<void>
  editRequest(): Promise<void>
  editWithAi(): Promise<void>
  goBack(): Promise<void>
  acknowledgePreview(): Promise<void>
  confirmSend(): Promise<void>
  viewSentRequest(): Promise<void>
  closeSentRequest(): Promise<void>
  loadDemoUtterance(utterance: string): Promise<void>
  previewReminders(): Promise<void>
  acknowledgeReminderPreview(): Promise<void>
  confirmReminderSend(): Promise<void>
  cancel(): Promise<void>
  retry(): Promise<void>
  reset(): Promise<void>
}

export interface AgentSimulator extends AgentActions {
  getSnapshot(): AgentSnapshot
  subscribe(listener: () => void): () => void
}

const STEP_DELAYS: Record<ActivityStepId, number> = {
  understand: 520,
  identify: 480,
  validate_email: 540,
  check_eligibility: 620,
  prepare: 580,
  wait_confirmation: 0,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createAgentSimulator(profileId = defaultProfileId): AgentSimulator {
  let snapshot: AgentSnapshot = {
    ...INITIAL_AGENT_SNAPSHOT,
    profileId,
  }
  let runId = 0
  let messageSeq = 0
  const listeners = new Set<() => void>()

  function emit() {
    listeners.forEach((listener) => listener())
  }

  function applyEvent(event: AgentEvent): AgentSnapshot {
    const next = reduceAgentSnapshot(snapshot, event)
    if (next !== snapshot) {
      snapshot = next
      emit()
    }
    return snapshot
  }

  function patch(partial: Partial<AgentSnapshot>) {
    snapshot = { ...snapshot, ...partial }
    emit()
  }

  function stillCurrent(id: number): boolean {
    return id === runId
  }

  function nextId(prefix: string): string {
    messageSeq += 1
    return `${prefix}-${messageSeq}`
  }

  function pushMessage(message: AgentMessage): string {
    patch({ messages: [...snapshot.messages, message] })
    return message.id
  }

  function pushUserText(text: string): string {
    return pushMessage({ id: nextId('user'), role: 'user', kind: 'text', text })
  }

  function pushAssistantText(
    text: string,
    tone: 'default' | 'error' | 'success' = 'default',
  ): string {
    return pushMessage({ id: nextId('assistant'), role: 'assistant', kind: 'text', text, tone })
  }

  function setActivity(id: ActivityStepId, status: ProcessingStep['status']) {
    patch({ activity: setActivityStep(snapshot.activity, id, status) })
  }

  function setSendingStep(id: SendingStepId, status: ProcessingStep['status']) {
    patch({ sendingSteps: setActivityStep(snapshot.sendingSteps, id, status) })
  }

  async function runActivityStep(id: ActivityStepId, work?: () => Promise<void>) {
    setActivity(id, 'active')
    await simulateDelay(STEP_DELAYS[id])
    if (work) {
      await work()
    }
    setActivity(id, 'done')
  }

  function resolveUnderstandingCards() {
    patch({
      messages: snapshot.messages.map((message) =>
        message.kind === 'understanding' && !message.resolved
          ? { ...message, resolved: true }
          : message,
      ),
      readyToPrepare: false,
    })
  }

  async function handleUserMessage(text: string): Promise<void> {
    const parsed = parseIntent(text)
    const state = snapshot.state

    if (parsed.intent === 'cancel' && state === 'awaiting_confirmation') {
      pushUserText(text)
      applyEvent({ type: 'CANCEL' })
      return
    }

    if (parsed.intent === 'cancel') {
      pushUserText(text)
      await cancel()
      return
    }

    if (state === 'awaiting_confirmation') {
      pushUserText(text)
      pushAssistantText('Nothing is sent until you click Send Review Request.')
      return
    }

    if (state === 'reminder_confirmation') {
      pushUserText(text)
      pushAssistantText('Nothing is sent until you click the confirmation button.')
      return
    }

    if (state === 'reminder_preview') {
      const id = ++runId
      pushUserText(text)
      patch({ composerDraft: '', revisingEmail: true })
      await simulateDelay(420)
      if (!stillCurrent(id)) return
      const drafts = snapshot.reminderDrafts.map((email) => reviseReminderEmail(email, text))
      patch({ reminderDrafts: drafts, revisingEmail: false, editingWithAi: true })
      pushAssistantText('Updated all reminder messages based on your request.')
      return
    }

    if (
      parsed.intent === 'send_reminder' ||
      parsed.intent === 'send_batch_reminders' ||
      parsed.intent === 'show_pending' ||
      parsed.intent === 'show_reminder_ready'
    ) {
      await runReviewAction(parsed)
      return
    }

    const revisingInPlace = Boolean(snapshot.emailDraft) && state === 'preview'

    if (revisingInPlace) {
      const id = ++runId
      pushUserText(text)
      patch({ intent: parsed, composerDraft: '', editingWithAi: true })
      await runRevision(id, text)
      return
    }

    const id = ++runId
    pushUserText(text)
    resolveUnderstandingCards()
    applyEvent({ type: 'USER_MESSAGE' })
    patch({
      intent: parsed,
      composerDraft: '',
      assistantMessage: null,
      editingWithAi: false,
      revisingEmail: false,
      activity: createActivity(),
    })

    const startFresh =
      parsed.intent === 'create_request' &&
      (state === 'idle' || state === 'completed' || state === 'error')
    const recipient = mergeRecipient(startFresh ? {} : snapshot.recipient, parsed)

    if (parsed.intent === 'revise_copy' && snapshot.emailDraft) {
      await runRevision(id, text)
      return
    }

    patch({ recipient })
    await runUnderstanding(id, recipient, parsed)
  }

  async function runReviewAction(parsed: ParsedIntent): Promise<void> {
    const id = ++runId
    pushUserText(parsed.utterance)
    resolveUnderstandingCards()
    applyEvent({ type: 'USER_MESSAGE' })
    patch({
      composerDraft: '',
      intent: parsed,
      assistantMessage: null,
      reminderCandidates: [],
      reminderDrafts: [],
      queryRequests: [],
      activity: reviewActionActivity(),
    })

    await runReviewActivityStep('understand', 320)
    if (!stillCurrent(id)) return

    if (parsed.intent === 'show_pending' || parsed.intent === 'show_reminder_ready') {
      await runReviewActivityStep('find', 360)
      if (!stillCurrent(id)) return
      const requests =
        parsed.intent === 'show_pending'
          ? listPendingRequests(snapshot.profileId)
          : listReminderReadyRequests(snapshot.profileId)
      const queryTitle =
        parsed.intent === 'show_pending'
          ? 'Pending review requests'
          : 'Requests ready for a reminder'
      applyEvent({ type: 'SHOW_RESULTS' })
      patch({ queryRequests: requests, queryTitle, activity: [] })
      pushAssistantText(
        requests.length > 0
          ? `I found ${requests.length} matching request${requests.length === 1 ? '' : 's'}.`
          : 'I did not find any matching requests.',
      )
      return
    }

    await runReviewActivityStep('find', 380)
    if (!stillCurrent(id)) return
    const batch = parsed.intent === 'send_batch_reminders'
    const name = recipientDisplayName(parsed)
    const candidates = findReminderCandidates(snapshot.profileId, batch ? undefined : name)

    await runReviewActivityStep('eligibility', 420)
    if (!stillCurrent(id)) return
    setReviewActivity('preview', 'pending')
    applyEvent({ type: 'REMINDERS_FOUND' })
    patch({ reminderCandidates: candidates })

    if (candidates.length === 0) {
      pushAssistantText(
        batch
          ? 'I did not find any pending review requests.'
          : `I couldn't find a review request for ${name || 'that customer'}.`,
        'error',
      )
      return
    }

    const eligible = candidates.filter((candidate) => candidate.eligible)
    if (batch) {
      pushAssistantText(
        `I found ${candidates.length} pending request${candidates.length === 1 ? '' : 's'}. ${eligible.length} ${eligible.length === 1 ? 'is' : 'are'} eligible for a reminder.`,
      )
    } else {
      const candidate = candidates[0]
      pushAssistantText(
        candidate.eligible
          ? `I found ${candidate.request.recipientName}'s pending review request.`
          : `${candidate.request.recipientName} isn't eligible for a reminder yet. ${candidate.reason}`,
        candidate.eligible ? 'default' : 'error',
      )
    }
  }

  function reviewActionActivity(): ProcessingStep[] {
    return [
      { id: 'understand', label: 'Understanding request', status: 'active' },
      { id: 'find', label: 'Finding pending requests', status: 'pending' },
      { id: 'eligibility', label: 'Checking reminder eligibility', status: 'pending' },
      { id: 'preview', label: 'Preparing reminders', status: 'pending' },
      { id: 'confirm', label: 'Waiting for confirmation', status: 'pending' },
    ]
  }

  function setReviewActivity(id: string, status: ProcessingStep['status']) {
    patch({
      activity: snapshot.activity.map((step) => (step.id === id ? { ...step, status } : step)),
    })
  }

  async function runReviewActivityStep(id: string, delay: number) {
    setReviewActivity(id, 'active')
    await simulateDelay(delay)
    setReviewActivity(id, 'done')
    const next =
      id === 'understand' ? 'find' : id === 'find' ? 'eligibility' : id === 'eligibility' ? 'preview' : null
    if (next) setReviewActivity(next, 'active')
  }

  async function runUnderstanding(
    id: number,
    recipient: ExtractedRecipient,
    parsed: ParsedIntent | null,
  ): Promise<void> {
    await runActivityStep('understand')
    if (!stillCurrent(id)) {
      return
    }

    await runActivityStep('identify')
    if (!stillCurrent(id)) {
      return
    }

    const missing = missingRecipientFields(recipient)
    if (missing.length > 0) {
      const question = missingInformationQuestion(recipient)
      applyEvent({ type: 'INFORMATION_MISSING', fields: missing as MissingField[] })
      patch({ recipient, intent: parsed, assistantMessage: question })
      pushAssistantText(question)
      return
    }

    const email = recipient.email ?? ''
    await runActivityStep('validate_email')
    if (!stillCurrent(id)) {
      return
    }

    if (!EMAIL_PATTERN.test(email)) {
      const message = 'That email address doesn’t look valid.'
      applyEvent({ type: 'INFORMATION_COMPLETE' })
      applyEvent({ type: 'VALIDATION_FAILED', message })
      patch({ assistantMessage: message })
      pushAssistantText(message, 'error')
      return
    }

    const input = toRecipientInput(recipient)
    const eligibility = await (async () => {
      setActivity('check_eligibility', 'active')
      const result = await validateRecipient({
        profileId: snapshot.profileId,
        recipient: input,
      })
      return result
    })()
    if (!stillCurrent(id)) {
      return
    }

    if (!eligibility.ok) {
      setActivity('check_eligibility', 'done')
      applyEvent({ type: 'INFORMATION_COMPLETE' })
      applyEvent({ type: 'VALIDATION_FAILED', message: eligibility.validation.message })
      patch({ assistantMessage: eligibility.validation.message })
      pushAssistantText(eligibility.validation.message, 'error')
      return
    }
    setActivity('check_eligibility', 'done')

    const prepared = await (async () => {
      setActivity('prepare', 'active')
      await simulateDelay(STEP_DELAYS.prepare)
      return prepareRequestTool({ profileId: snapshot.profileId, recipient: input })
    })()
    if (!stillCurrent(id)) {
      return
    }

    if (!prepared.ok || !prepared.request) {
      setActivity('prepare', 'done')
      const message = prepared.error?.message ?? 'The request could not be prepared.'
      applyEvent({ type: 'INFORMATION_COMPLETE' })
      applyEvent({ type: 'VALIDATION_FAILED', message })
      patch({ assistantMessage: message })
      pushAssistantText(message, 'error')
      return
    }
    setActivity('prepare', 'done')
    setActivity('wait_confirmation', 'active')

    const summary: UnderstandingSummary = {
      customerName: prepared.request.recipientName,
      email: prepared.request.recipientEmail,
      fromName: prepared.request.profile.name,
      fromLabel:
        prepared.request.profile.title ??
        (prepared.request.profile.kind === 'location' ? 'Location' : 'Professional'),
      status: 'Ready to prepare',
    }

    pushMessage({
      id: nextId('understood'),
      role: 'assistant',
      kind: 'understanding',
      summary,
      resolved: false,
    })
    patch({
      recipient,
      intent: parsed,
      readyToPrepare: true,
      assistantMessage: 'I understood your request.',
    })
  }

  async function runRevision(id: number, instruction: string): Promise<void> {
    const profile = getProfile(snapshot.profileId)
    const draft = snapshot.emailDraft
    const recipient = snapshot.recipient
    const name = recipientDisplayName(recipient)

    if (!profile || !draft || !recipient.email || !name) {
      await runUnderstanding(id, recipient, snapshot.intent)
      return
    }

    patch({
      revisingEmail: true,
      editingWithAi: true,
      assistantMessage: null,
    })

    const revised = await reviseEmail({
      email: draft,
      instruction,
      profile,
      recipientName: name,
      recipientEmail: recipient.email,
    })
    if (!stillCurrent(id)) {
      return
    }

    if (!revised.ok || !revised.email) {
      const message = revised.error?.message ?? 'The message could not be updated.'
      patch({ revisingEmail: false, assistantMessage: message })
      pushAssistantText(message, 'error')
      return
    }

    const confirmation = 'Updated the message based on your request.'
    patch({
      emailDraft: revised.email,
      revisingEmail: false,
      editingWithAi: true,
      assistantMessage: confirmation,
    })
    pushAssistantText(confirmation)
  }

  /** Runs after the user explicitly clicks Prepare Request on the summary card. */
  async function prepareRequest(): Promise<void> {
    if (snapshot.state !== 'understanding' || !snapshot.readyToPrepare) {
      return
    }

    const id = ++runId
    resolveUnderstandingCards()
    applyEvent({ type: 'INFORMATION_COMPLETE' })

    const input = toRecipientInput(snapshot.recipient)
    setActivity('prepare', 'active')

    const eligibility = await validateRecipient({ profileId: snapshot.profileId, recipient: input })
    if (!stillCurrent(id)) {
      return
    }

    if (!eligibility.ok) {
      setActivity('prepare', 'done')
      applyEvent({ type: 'VALIDATION_FAILED', message: eligibility.validation.message })
      patch({ assistantMessage: eligibility.validation.message })
      pushAssistantText(eligibility.validation.message, 'error')
      return
    }
    applyEvent({ type: 'VALIDATION_PASSED' })

    const prepared = await prepareRequestTool({ profileId: snapshot.profileId, recipient: input })
    if (!stillCurrent(id)) {
      return
    }

    if (!prepared.ok || !prepared.request) {
      const message = prepared.error?.message ?? 'The request could not be prepared.'
      applyEvent({ type: 'PREPARATION_FAILED', message })
      patch({ assistantMessage: message })
      pushAssistantText(message, 'error')
      return
    }

    const generated = await generateEmail({
      profile: prepared.request.profile,
      recipientName: prepared.request.recipientName,
      recipientEmail: prepared.request.recipientEmail,
      tone: toneFromIntent(snapshot.intent),
    })
    if (!stillCurrent(id)) {
      return
    }

    if (!generated.ok || !generated.email) {
      setActivity('prepare', 'done')
      const message = generated.error?.message ?? 'The email could not be generated.'
      applyEvent({ type: 'PREPARATION_FAILED', message })
      patch({ assistantMessage: message })
      pushAssistantText(message, 'error')
      return
    }
    setActivity('prepare', 'done')
    setActivity('wait_confirmation', 'active')

    applyEvent({ type: 'PREPARATION_COMPLETE' })
    patch({
      emailDraft: generated.email,
      editingWithAi: false,
      revisingEmail: false,
      assistantMessage: null,
    })
  }

  /** Returns to the composer with the original wording so the user can adjust it. */
  async function editRequest(): Promise<void> {
    runId += 1
    resolveUnderstandingCards()

    const lastUserMessage = [...snapshot.messages]
      .reverse()
      .find((message) => message.role === 'user' && message.kind === 'text')

    applyEvent({ type: 'CANCEL' })
    patch({
      composerDraft: lastUserMessage && lastUserMessage.kind === 'text' ? lastUserMessage.text : '',
      assistantMessage: null,
    })
  }

  async function confirmSend(): Promise<void> {
    const draft = snapshot.emailDraft
    if (!draft || snapshot.state !== 'awaiting_confirmation') {
      return
    }

    const id = ++runId
    applyEvent({ type: 'CONFIRM_SEND' })
    patch({
      sendingSteps: createSendingSteps(),
      sentRequest: null,
      viewingRequest: false,
      assistantMessage: 'Sending review request...',
    })
    setActivity('wait_confirmation', 'done')
    setSendingStep('prepare_email', 'active')
    await simulateDelay(480)
    if (!stillCurrent(id)) {
      return
    }

    setSendingStep('prepare_email', 'done')
    setSendingStep('sending', 'active')
    const result = await sendRequest({ profileId: snapshot.profileId, email: draft })
    if (!stillCurrent(id)) {
      return
    }

    if (!result.ok || !result.request) {
      const message = result.error?.message ?? 'The request could not be sent.'
      applyEvent({ type: 'SEND_FAILED', message })
      patch({ assistantMessage: message, sendingSteps: [] })
      pushAssistantText(message, 'error')
      return
    }

    setSendingStep('sending', 'done')
    setSendingStep('delivered', 'active')
    await simulateDelay(360)
    if (!stillCurrent(id)) {
      return
    }

    setSendingStep('delivered', 'done')
    await simulateDelay(420)
    if (!stillCurrent(id)) {
      return
    }

    applyEvent({ type: 'SEND_SUCCEEDED' })
    patch({
      sentRequest: result.request,
      assistantMessage: 'Review request sent',
    })
  }

  async function previewReminders(): Promise<void> {
    if (snapshot.state !== 'reminder_found') return
    const eligible = snapshot.reminderCandidates.filter((candidate) => candidate.eligible)
    if (eligible.length === 0) return

    setReviewActivity('preview', 'active')
    await simulateDelay(420)
    const drafts = eligible.map((candidate) => generateReminderEmail(candidate.request))
    setReviewActivity('preview', 'done')
    setReviewActivity('confirm', 'active')
    applyEvent({ type: 'REMINDER_PREVIEW_READY' })
    patch({
      reminderDrafts: drafts,
      editingWithAi: false,
      revisingEmail: false,
    })
  }

  async function acknowledgeReminderPreview(): Promise<void> {
    if (snapshot.state !== 'reminder_preview') return
    applyEvent({ type: 'REMINDER_REQUEST_CONFIRMATION' })
    patch({ editingWithAi: false })
  }

  async function confirmReminderSend(): Promise<void> {
    if (snapshot.state !== 'reminder_confirmation') return
    const eligible = snapshot.reminderCandidates.filter((candidate) => candidate.eligible)
    if (eligible.length === 0 || eligible.length !== snapshot.reminderDrafts.length) return

    const id = ++runId
    applyEvent({ type: 'REMINDER_SEND_STARTED' })
    patch({
      sendingSteps: [
        { id: 'prepare_email', label: `Preparing ${eligible.length} reminder${eligible.length === 1 ? '' : 's'}`, status: 'active' },
        { id: 'sending', label: 'Sending reminders', status: 'pending' },
        { id: 'delivered', label: 'Delivered', status: 'pending' },
      ],
      reminderSentCount: 0,
    })
    await simulateDelay(360)
    if (!stillCurrent(id)) return
    setSendingStep('prepare_email', 'done')
    setSendingStep('sending', 'active')

    const results = await Promise.all(
      eligible.map((candidate, index) =>
        sendReminder(candidate.request.id, snapshot.reminderDrafts[index]),
      ),
    )
    if (!stillCurrent(id)) return
    const sentCount = results.filter(Boolean).length
    setSendingStep('sending', 'done')
    setSendingStep('delivered', 'active')
    await simulateDelay(320)
    if (!stillCurrent(id)) return
    setSendingStep('delivered', 'done')
    applyEvent({ type: 'REMINDER_SEND_SUCCEEDED' })
    patch({ reminderSentCount: sentCount, assistantMessage: 'Reminder delivery simulated.' })
  }

  async function cancel(): Promise<void> {
    if (
      snapshot.state === 'awaiting_confirmation' ||
      snapshot.state === 'reminder_confirmation'
    ) {
      applyEvent({ type: 'CANCEL' })
      return
    }

    runId += 1
    resolveUnderstandingCards()
    applyEvent({ type: 'CANCEL' })
    patch({ assistantMessage: null, composerDraft: '', activity: [], revisingEmail: false, editingWithAi: false })
  }

  async function retry(): Promise<void> {
    const id = ++runId
    applyEvent({ type: 'RETRY' })
    patch({ assistantMessage: 'Trying again…', activity: createActivity() })
    await runUnderstanding(id, snapshot.recipient, snapshot.intent)
  }

  async function reset(): Promise<void> {
    runId += 1
    applyEvent({ type: 'RESET' })
    patch({ ...INITIAL_AGENT_SNAPSHOT, state: 'idle', profileId: snapshot.profileId })
  }

  async function loadDemoUtterance(utterance: string): Promise<void> {
    await reset()
    patch({ composerDraft: utterance.trim() })
  }

  return {
    getSnapshot() {
      return snapshot
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    sendUserMessage: handleUserMessage,
    prepareRequest,
    editRequest,
    async editWithAi() {
      if (snapshot.state !== 'preview' && snapshot.state !== 'reminder_preview') {
        return
      }
      patch({ editingWithAi: true })
    },
    async goBack() {
      if (snapshot.state !== 'preview') {
        return
      }
      applyEvent({ type: 'GO_BACK' })
      const messages = [...snapshot.messages]
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index]
        if (message.kind === 'understanding') {
          messages[index] = { ...message, resolved: false }
          break
        }
      }
      patch({
        readyToPrepare: true,
        editingWithAi: false,
        revisingEmail: false,
        messages,
      })
    },
    async acknowledgePreview() {
      if (snapshot.state !== 'preview') {
        return
      }
      applyEvent({ type: 'REQUEST_CONFIRMATION' })
      patch({
        editingWithAi: false,
        assistantMessage: 'Nothing is sent until you confirm.',
      })
    },
    confirmSend,
    async viewSentRequest() {
      if (snapshot.state !== 'completed' || !snapshot.sentRequest) {
        return
      }
      patch({ viewingRequest: true })
    },
    async closeSentRequest() {
      if (snapshot.state !== 'completed') {
        return
      }
      patch({ viewingRequest: false })
    },
    cancel,
    retry,
    reset,
    loadDemoUtterance,
    previewReminders,
    acknowledgeReminderPreview,
    confirmReminderSend,
  }
}

function toRecipientInput(recipient: ExtractedRecipient): RecipientInput {
  return {
    name: recipientDisplayName(recipient) || undefined,
    email: recipient.email,
  }
}

function toneFromIntent(intent: ParsedIntent | null): EmailTone | undefined {
  const text = intent?.utterance.toLowerCase() ?? ''
  if (text.includes('warm')) {
    return 'warm'
  }
  if (text.includes('short') || text.includes('brief')) {
    return 'brief'
  }
  if (text.includes('formal') || text.includes('professional')) {
    return 'professional'
  }
  return undefined
}
