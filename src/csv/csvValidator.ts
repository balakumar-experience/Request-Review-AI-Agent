import { normalizeEmail } from '../data/mockData'
import { REQUIRED_CSV_COLUMNS } from './csvParser'
import type {
  CsvParseResult,
  CsvRecipientRow,
  CsvValidationResult,
} from './csvTypes'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCsvRecipients(parsed: CsvParseResult): CsvValidationResult {
  const missingColumns = REQUIRED_CSV_COLUMNS.filter(
    (column) => !parsed.headers.includes(column),
  )

  if (missingColumns.length > 0) {
    return emptyResult(missingColumns)
  }

  const seenEmails = new Set<string>()
  const rows: CsvRecipientRow[] = []

  parsed.records.forEach((record, index) => {
    const firstName = value(record.first_name)
    const lastName = value(record.last_name)
    const email = normalizeEmail(value(record.email))

    if (!firstName && !lastName && !email) {
      return
    }

    const issues: string[] = []
    if (!firstName) issues.push('Missing first name')
    if (!lastName) issues.push('Missing last name')
    if (!email) {
      issues.push('Missing email')
    } else if (!EMAIL_PATTERN.test(email)) {
      issues.push('Invalid email')
    }

    let status: CsvRecipientRow['status'] = issues.length > 0 ? 'invalid' : 'ready'
    if (email && seenEmails.has(email)) {
      status = 'duplicate'
      issues.splice(0, issues.length, 'Duplicate email')
    } else if (email) {
      seenEmails.add(email)
    }

    rows.push({
      id: `csv-row-${index + 2}`,
      rowNumber: index + 2,
      recipient: { firstName, lastName, email },
      status,
      issues,
    })
  })

  return {
    rows,
    total: rows.length,
    ready: rows.filter((row) => row.status === 'ready').length,
    invalid: rows.filter((row) => row.status === 'invalid').length,
    invalidEmails: rows.filter(
      (row) => row.status === 'invalid' && row.issues.includes('Invalid email'),
    ).length,
    duplicates: rows.filter((row) => row.status === 'duplicate').length,
    missingColumns: [],
  }
}

function value(input: string | undefined): string {
  return String(input ?? '').trim()
}

function emptyResult(missingColumns: string[]): CsvValidationResult {
  return {
    rows: [],
    total: 0,
    ready: 0,
    invalid: 0,
    invalidEmails: 0,
    duplicates: 0,
    missingColumns,
  }
}
