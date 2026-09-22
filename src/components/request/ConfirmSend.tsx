import type { EmailDraft } from '../../types/requestReview'

interface ConfirmSendProps {
  email: EmailDraft
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmSend({ email, onCancel, onConfirm }: ConfirmSendProps) {
  return (
    <article className="confirm">
      <h2 className="confirm__title">Ready to send?</h2>

      <dl className="confirm__fields">
        <div>
          <dt>To</dt>
          <dd>
            {email.toName}
            <span>{email.toEmail}</span>
          </dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>{email.fromName}</dd>
        </div>
      </dl>

      <div className="confirm__actions">
        <button type="button" className="btn" onClick={onCancel}>
          Go Back
        </button>
        <button type="button" className="btn btn--primary" onClick={onConfirm}>
          Send Review Request
        </button>
      </div>
    </article>
  )
}
