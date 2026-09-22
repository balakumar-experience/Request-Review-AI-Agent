import { useRef, useState } from 'react'
import { parseCsvFile } from '../csv/csvParser'
import type {
  CsvBatchActivity,
  CsvBatchSnapshot,
  CsvValidationResult,
} from '../csv/csvTypes'
import { validateCsvRecipients } from '../csv/csvValidator'
import { getProfile } from '../data/mockData'
import { simulateDelay } from '../tools/delay'
import { generateEmail, reviseEmail } from '../tools/generateEmail'
import { sendRequest } from '../tools/sendRequest'

const INITIAL_ACTIVITY: CsvBatchActivity[] = [
  { id: 'read', label: 'Reading your CSV', status: 'pending' },
  { id: 'validate', label: 'Validating recipients', status: 'pending' },
  { id: 'prepare', label: 'Preparing review requests', status: 'pending' },
  { id: 'generate', label: 'Generating personalized messages', status: 'pending' },
  { id: 'confirm', label: 'Waiting for confirmation', status: 'pending' },
]

function initialSnapshot(): CsvBatchSnapshot {
  return {
    state: 'upload',
    fileName: '',
    validation: null,
    drafts: [],
    tone: 'professional',
    editInstruction: '',
    activity: INITIAL_ACTIVITY,
    sendingCurrent: 0,
    sentRequests: [],
    errorMessage: null,
  }
}

export function useCsvBatchAgent(profileId: string) {
  const [snapshot, setSnapshot] = useState<CsvBatchSnapshot>(initialSnapshot)
  const runId = useRef(0)

  function patch(partial: Partial<CsvBatchSnapshot>) {
    setSnapshot((current) => ({ ...current, ...partial }))
  }

  function setActivity(
    id: string,
    status: CsvBatchActivity['status'],
    detail?: string,
  ) {
    setSnapshot((current) => ({
      ...current,
      activity: current.activity.map((step) =>
        step.id === id ? { ...step, status, detail: detail ?? step.detail } : step,
      ),
    }))
  }

  async function upload(file: File) {
    const id = ++runId.current
    if (!isCsvFile(file)) {
      patch({
        state: 'error',
        fileName: file.name,
        errorMessage: 'Please upload a valid CSV file.',
      })
      return
    }

    setSnapshot({
      ...initialSnapshot(),
      state: 'reading',
      fileName: file.name,
      activity: INITIAL_ACTIVITY.map((step) =>
        step.id === 'read' ? { ...step, status: 'active' } : step,
      ),
    })
    await simulateDelay(420)
    const parsed = await parseCsvFile(file)
    if (id !== runId.current) return

    const validation = validateCsvRecipients(parsed)
    setActivity('read', 'done', `Found ${validation.total} recipients`)
    setActivity('validate', 'active')
    await simulateDelay(480)
    if (id !== runId.current) return

    const errorMessage = validationError(validation, parsed.errors)
    setActivity(
      'validate',
      'done',
      validation.ready > 0 ? `${validation.ready} recipients are ready` : undefined,
    )
    patch({
      state: errorMessage ? 'error' : 'validation',
      validation,
      errorMessage,
    })
  }

  async function prepare() {
    const validation = snapshot.validation
    const profile = getProfile(profileId)
    if (!validation || validation.ready === 0 || !profile) return

    const id = ++runId.current
    patch({ state: 'preparing', errorMessage: null })
    setActivity('prepare', 'active')
    await simulateDelay(420)
    if (id !== runId.current) return
    setActivity('prepare', 'done', 'Requests prepared')
    setActivity('generate', 'active')

    const readyRows = validation.rows.filter((row) => row.status === 'ready')
    const generated = await Promise.all(
      readyRows.map((row) =>
        generateEmail({
          profile,
          recipientName: `${row.recipient.firstName} ${row.recipient.lastName}`.trim(),
          recipientEmail: row.recipient.email,
          tone: snapshot.tone,
        }),
      ),
    )
    if (id !== runId.current) return

    const drafts = generated.flatMap((result) => (result.email ? [result.email] : []))
    setActivity('generate', 'done', 'Messages ready')
    setActivity('confirm', 'active')
    patch({
      state: drafts.length > 0 ? 'preview' : 'error',
      drafts,
      errorMessage: drafts.length > 0 ? null : 'No messages could be prepared.',
    })
  }

  async function editMessages(instruction: string) {
    const profile = getProfile(profileId)
    if (!profile || !instruction.trim() || snapshot.drafts.length === 0) return

    const id = ++runId.current
    patch({ state: 'preparing', editInstruction: instruction })
    const revised = await Promise.all(
      snapshot.drafts.map((email) =>
        reviseEmail({
          email,
          instruction,
          profile,
          recipientName: email.toName,
          recipientEmail: email.toEmail,
        }),
      ),
    )
    if (id !== runId.current) return

    const drafts = revised.map((result, index) => result.email ?? snapshot.drafts[index])
    patch({ state: 'preview', drafts, editInstruction: '' })
  }

  async function send() {
    if (snapshot.state !== 'confirming' || snapshot.drafts.length === 0) return

    const id = ++runId.current
    const total = snapshot.drafts.length
    patch({ state: 'sending', sendingCurrent: 0 })
    setActivity('confirm', 'done')

    const sendPromise = Promise.all(
      snapshot.drafts.map((email) =>
        sendRequest({
          profileId,
          email,
          source: 'csv',
          skipEligibility: true,
        }),
      ),
    )

    const steps = Math.min(total, 12)
    for (let step = 1; step <= steps; step += 1) {
      await simulateDelay(90)
      if (id !== runId.current) return
      patch({ sendingCurrent: Math.ceil((step / steps) * total) })
    }

    const results = await sendPromise
    if (id !== runId.current) return
    const sentRequests = results.flatMap((result) => (result.request ? [result.request] : []))
    patch({
      state: 'completed',
      sendingCurrent: sentRequests.length,
      sentRequests,
      errorMessage:
        sentRequests.length === total ? null : 'Some requests could not be simulated.',
    })
  }

  function reset() {
    runId.current += 1
    setSnapshot(initialSnapshot())
  }

  return {
    snapshot,
    upload,
    prepare,
    editMessages,
    continueToConfirmation: () => patch({ state: 'confirming' }),
    backToValidation: () => patch({ state: 'validation' }),
    backToPreview: () => patch({ state: 'preview' }),
    send,
    reset,
  }
}

function isCsvFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv')
}

function validationError(validation: CsvValidationResult, parseErrors: string[]): string | null {
  if (validation.missingColumns.length > 0) {
    return `This CSV is missing required columns: ${validation.missingColumns.join(', ')}`
  }
  if (validation.total === 0) {
    return 'No recipients were found in this CSV.'
  }
  if (validation.ready === 0) {
    return 'No valid recipients found. Please correct the CSV and upload it again.'
  }
  if (parseErrors.length > 0 && validation.rows.length === 0) {
    return 'Please upload a valid CSV file.'
  }
  return null
}
