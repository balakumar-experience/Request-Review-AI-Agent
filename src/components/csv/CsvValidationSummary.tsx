import { AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react'
import type { CsvValidationResult } from '../../csv/csvTypes'

interface CsvValidationSummaryProps {
  fileName: string
  result: CsvValidationResult
}

export function CsvValidationSummary({ fileName, result }: CsvValidationSummaryProps) {
  return (
    <section className="csv-summary" aria-label="CSV validation summary">
      <div className="csv-summary__title">
        <FileCheck2 size={20} />
        <div>
          <h2>CSV uploaded</h2>
          <p>{fileName}</p>
        </div>
      </div>
      <div className="csv-summary__stats">
        <span>
          <strong>{result.total}</strong>
          recipients found
        </span>
        <span className="csv-summary__stat csv-summary__stat--ready">
          <CheckCircle2 size={15} />
          <strong>{result.ready}</strong> ready to send
        </span>
        <span className="csv-summary__stat csv-summary__stat--warning">
          <AlertTriangle size={15} />
          <strong>{result.invalid}</strong> invalid rows
        </span>
        <span className="csv-summary__stat csv-summary__stat--warning">
          <AlertTriangle size={15} />
          <strong>{result.duplicates}</strong> duplicate recipients
        </span>
      </div>
    </section>
  )
}
