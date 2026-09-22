import { ArrowLeft, Sparkles } from 'lucide-react'
import type { EmailDraft } from '../../types/requestReview'

interface EmailPreviewProps {
  email: EmailDraft
  busy?: boolean
  onEditWithAi: () => void
  onGoBack: () => void
  onSend: () => void
}

export function EmailPreview({ email, busy, onEditWithAi, onGoBack, onSend }: EmailPreviewProps) {
  return (
    <article className="email" data-updating={busy ? 'true' : 'false'}>
      <p className="email__kicker">Review Request</p>

      <div className="email__window">
        <div className="email__chrome" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <dl className="email__headers">
          <div>
            <dt>To</dt>
            <dd>
              {email.toName}
              <span>{email.toEmail}</span>
            </dd>
          </div>
          <div>
            <dt>From</dt>
            <dd>
              {email.fromName}
              <span>{email.fromLabel}</span>
            </dd>
          </div>
          <div>
            <dt>Subject</dt>
            <dd>{email.subject}</dd>
          </div>
        </dl>

        <div className="email__body">
          {email.body.split('\n').map((line, index) =>
            line ? <p key={index}>{line}</p> : <p key={index}>&nbsp;</p>,
          )}
          <span className="email__cta">{email.ctaLabel}</span>
        </div>
      </div>

      <div className="email__actions">
        <button type="button" className="btn" onClick={onEditWithAi} disabled={busy}>
          <Sparkles size={15} />
          Edit with AI
        </button>
        <button type="button" className="btn" onClick={onGoBack} disabled={busy}>
          <ArrowLeft size={15} />
          Go Back
        </button>
        <button type="button" className="btn btn--primary" onClick={onSend} disabled={busy}>
          Send Request
        </button>
      </div>
    </article>
  )
}
