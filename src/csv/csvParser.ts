import Papa from 'papaparse'
import type { CsvParseResult } from './csvTypes'

export const REQUIRED_CSV_COLUMNS = ['first_name', 'last_name', 'email'] as const

export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeader,
      complete(result) {
        resolve({
          headers: result.meta.fields ?? [],
          records: result.data,
          errors: result.errors.map((error) =>
            error.row === undefined ? error.message : `Row ${error.row + 2}: ${error.message}`,
          ),
        })
      },
      error(error) {
        resolve({ headers: [], records: [], errors: [error.message] })
      },
    })
  })
}

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}
