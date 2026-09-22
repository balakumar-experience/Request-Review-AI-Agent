import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

interface CsvUploadProps {
  busy?: boolean
  errorMessage?: string | null
  onUpload: (file: File) => void
}

export function CsvUpload({ busy, errorMessage, onUpload }: CsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function acceptFile(file: File | undefined) {
    if (file) onUpload(file)
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  function downloadTemplate() {
    const blob = new Blob(['first_name,last_name,email\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'review-request-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="csv-upload-card">
      <div
        className={`csv-dropzone${dragging ? ' csv-dropzone--dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
      >
        <span className="csv-dropzone__icon">
          <UploadCloud size={26} />
        </span>
        <h2>Upload Review Requests</h2>
        <p>Drag and drop your CSV here</p>
        <span className="csv-dropzone__or">or</span>
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet size={16} />
          {busy ? 'Reading CSV…' : 'Choose CSV'}
        </button>
        <input
          ref={inputRef}
          className="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
        <p className="csv-dropzone__meta">Supported format: CSV</p>
        <p className="csv-dropzone__meta">
          Required columns: First Name, Last Name, Email
        </p>
      </div>

      {errorMessage ? (
        <div className="csv-error" role="alert">
          <strong>Couldn’t use this CSV</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <button type="button" className="csv-template-link" onClick={downloadTemplate}>
        <Download size={14} />
        Download CSV template
      </button>
    </section>
  )
}
