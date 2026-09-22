import type { EmailDraft, EmailTone, ReviewRequest } from '../types/requestReview'

export interface ReviewRequestRecipient {
  firstName: string
  lastName: string
  email: string
}

export type CsvRecipientStatus = 'ready' | 'invalid' | 'duplicate'

export interface CsvRecipientRow {
  id: string
  rowNumber: number
  recipient: ReviewRequestRecipient
  status: CsvRecipientStatus
  issues: string[]
}

export interface CsvParseResult {
  headers: string[]
  records: Record<string, string>[]
  errors: string[]
}

export interface CsvValidationResult {
  rows: CsvRecipientRow[]
  total: number
  ready: number
  invalid: number
  invalidEmails: number
  duplicates: number
  missingColumns: string[]
}

export type CsvBatchState =
  | 'upload'
  | 'reading'
  | 'validation'
  | 'preparing'
  | 'preview'
  | 'confirming'
  | 'sending'
  | 'completed'
  | 'error'

export interface CsvBatchActivity {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
  detail?: string
}

export interface CsvBatchSnapshot {
  state: CsvBatchState
  fileName: string
  validation: CsvValidationResult | null
  drafts: EmailDraft[]
  tone: EmailTone
  editInstruction: string
  activity: CsvBatchActivity[]
  sendingCurrent: number
  sentRequests: ReviewRequest[]
  errorMessage: string | null
}
