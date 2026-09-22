import { ArrowLeft, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { CsvValidationResult } from '../../csv/csvTypes'
import type { EmailDraft, Profile } from '../../types/requestReview'

interface CsvBatchPreviewProps {
  profile: Profile
  validation: CsvValidationResult
  drafts: EmailDraft[]
  busy?: boolean
  onEdit: (instruction: string) => void
  onBack: () => void
  onContinue: () => void
}

export function CsvBatchPreview({
  profile,
  validation,
  drafts,
  busy,
  onEdit,
  onBack,
  onContinue,
}: CsvBatchPreviewProps) {
  const [editing, setEditing] = useState(false)
  const [instruction, setInstruction] = useState('')

  function applyEdit() {
    if (!instruction.trim()) return
    onEdit(instruction)
    setInstruction('')
    setEditing(false)
  }

  return (
    <section className="csv-preview">
      <header className="csv-preview__head">
        <p className="csv-kicker">Batch preview</p>
        <h2>Ready to send {validation.ready} review requests</h2>
        <dl>
          <div>
            <dt>From</dt>
            <dd>
              {profile.name}
              <span>{profile.title ?? profile.kind}</span>
            </dd>
          </div>
          <div>
            <dt>Recipients</dt>
            <dd>{validation.ready}</dd>
          </div>
          <div>
            <dt>Invalid</dt>
            <dd>{validation.invalid}</dd>
          </div>
          <div>
            <dt>Duplicates</dt>
            <dd>{validation.duplicates}</dd>
          </div>
        </dl>
      </header>

      <div className="csv-preview__samples">
        <h3>Sample messages</h3>
        {drafts.slice(0, 3).map((draft) => (
          <article key={draft.toEmail} className="csv-sample">
            <header>
              <strong>{draft.toName}</strong>
              <span>{draft.toEmail}</span>
            </header>
            <p className="csv-sample__subject">
              <small>Subject</small>
              {draft.subject}
            </p>
            <div className="csv-sample__body">
              {draft.body.split('\n').map((line, index) =>
                line ? <p key={index}>{line}</p> : <br key={index} />,
              )}
            </div>
          </article>
        ))}
        {drafts.length > 3 ? (
          <p className="csv-preview__more">+ {drafts.length - 3} more personalized messages</p>
        ) : null}
      </div>

      {editing ? (
        <div className="csv-ai-edit">
          <label htmlFor="csv-edit-instruction">How should I change all messages?</label>
          <textarea
            id="csv-edit-instruction"
            rows={3}
            value={instruction}
            placeholder="Make all messages warmer"
            onChange={(event) => setInstruction(event.target.value)}
          />
          <div>
            <button type="button" className="btn" onClick={() => setEditing(false)}>
              Cancel edit
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!instruction.trim() || busy}
              onClick={applyEdit}
            >
              Update all messages
            </button>
          </div>
        </div>
      ) : null}

      <div className="csv-actions">
        <button type="button" className="btn" disabled={busy} onClick={() => setEditing(true)}>
          <Sparkles size={15} />
          Edit with AI
        </button>
        <button type="button" className="btn" disabled={busy} onClick={onBack}>
          <ArrowLeft size={15} />
          Back
        </button>
        <button type="button" className="btn btn--primary" disabled={busy} onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  )
}
