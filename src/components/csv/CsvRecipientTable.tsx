import { useState } from 'react'
import type {
  CsvRecipientRow,
  CsvRecipientStatus,
} from '../../csv/csvTypes'

type Filter = 'all' | CsvRecipientStatus

interface CsvRecipientTableProps {
  rows: CsvRecipientRow[]
}

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'invalid', label: 'Invalid' },
  { id: 'duplicate', label: 'Duplicate' },
]

export function CsvRecipientTable({ rows }: CsvRecipientTableProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const visibleRows = filter === 'all' ? rows : rows.filter((row) => row.status === filter)

  return (
    <section className="csv-table-card">
      <div className="csv-filters" aria-label="Filter recipients">
        {FILTERS.map((item) => {
          const count =
            item.id === 'all' ? rows.length : rows.filter((row) => row.status === item.id).length
          return (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'csv-filter csv-filter--active' : 'csv-filter'}
              onClick={() => setFilter(item.id)}
            >
              {item.label} <span>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="csv-table-scroll">
        <table className="csv-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                <td>
                  {`${row.recipient.firstName} ${row.recipient.lastName}`.trim() || '—'}
                  <small>Row {row.rowNumber}</small>
                </td>
                <td>{row.recipient.email || '—'}</td>
                <td>
                  <span className={`csv-row-status csv-row-status--${row.status}`}>
                    {statusLabel(row)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function statusLabel(row: CsvRecipientRow): string {
  if (row.status === 'ready') return 'Ready'
  if (row.status === 'duplicate') return 'Duplicate'
  return row.issues.join(', ')
}
