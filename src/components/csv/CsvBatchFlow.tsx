import { CheckCircle2, RotateCcw } from 'lucide-react'
import { useCsvBatchAgent } from '../../agent/useCsvBatchAgent'
import type { Profile } from '../../types/requestReview'
import { AgentActivityPanel } from '../assistant/AgentActivityPanel'
import { CsvBatchPreview } from './CsvBatchPreview'
import { CsvRecipientTable } from './CsvRecipientTable'
import { CsvUpload } from './CsvUpload'
import { CsvValidationSummary } from './CsvValidationSummary'

interface CsvBatchFlowProps {
  profile: Profile
  onViewRequests: () => void
  onTalkToAi: () => void
}

export function CsvBatchFlow({ profile, onViewRequests, onTalkToAi }: CsvBatchFlowProps) {
  const agent = useCsvBatchAgent(profile.id)
  const { snapshot } = agent
  const validation = snapshot.validation

  if (snapshot.state === 'upload' || snapshot.state === 'reading' || snapshot.state === 'error') {
    return (
      <div className="csv-flow">
        <CsvUpload
          busy={snapshot.state === 'reading'}
          errorMessage={snapshot.errorMessage}
          onUpload={(file) => void agent.upload(file)}
        />
        {snapshot.state === 'reading' ? (
          <AgentActivityPanel steps={snapshot.activity} />
        ) : null}
      </div>
    )
  }

  if (!validation) {
    return null
  }

  if (snapshot.state === 'validation') {
    return (
      <div className="csv-flow">
        <CsvValidationSummary fileName={snapshot.fileName} result={validation} />
        <CsvRecipientTable rows={validation.rows} />
        <div className="csv-actions">
          <button type="button" className="btn" onClick={agent.reset}>
            Upload another CSV
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void agent.prepare()}>
            Prepare {validation.ready} Requests
          </button>
        </div>
      </div>
    )
  }

  if (snapshot.state === 'preparing') {
    return (
      <div className="csv-flow csv-flow--activity">
        <div className="csv-processing-copy">
          <p className="csv-kicker">AI batch preparation</p>
          <h2>Preparing your review requests</h2>
          <p>Generating personalized messages for each valid recipient.</p>
        </div>
        <AgentActivityPanel steps={snapshot.activity} />
      </div>
    )
  }

  if (snapshot.state === 'preview') {
    return (
      <CsvBatchPreview
        profile={profile}
        validation={validation}
        drafts={snapshot.drafts}
        onEdit={(instruction) => void agent.editMessages(instruction)}
        onBack={agent.backToValidation}
        onContinue={agent.continueToConfirmation}
      />
    )
  }

  if (snapshot.state === 'confirming') {
    return (
      <section className="csv-confirm">
        <p className="csv-kicker">Explicit confirmation required</p>
        <h2>Ready to send</h2>
        <strong className="csv-confirm__count">{validation.ready} review requests</strong>
        <p>{validation.invalid} invalid rows skipped</p>
        <p>{validation.duplicates} duplicate rows skipped</p>
        <dl>
          <dt>From</dt>
          <dd>{profile.name}</dd>
        </dl>
        <div className="csv-actions">
          <button type="button" className="btn" onClick={agent.backToPreview}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void agent.send()}>
            Send {validation.ready} Review Requests
          </button>
        </div>
      </section>
    )
  }

  if (snapshot.state === 'sending') {
    const progress =
      validation.ready === 0 ? 0 : Math.round((snapshot.sendingCurrent / validation.ready) * 100)
    return (
      <section className="csv-sending" aria-live="polite">
        <p className="csv-kicker">Simulated delivery</p>
        <h2>Sending review requests…</h2>
        <p>Preparing {validation.ready} requests</p>
        <div className="csv-progress" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <strong>
          {snapshot.sendingCurrent} / {validation.ready}
        </strong>
        <p>Sending…</p>
      </section>
    )
  }

  return (
    <section className="csv-complete">
      <CheckCircle2 size={38} />
      <p className="csv-kicker">Delivered</p>
      <h2>Review requests sent</h2>
      <strong>{snapshot.sentRequests.length} requests sent successfully</strong>
      <p>{validation.invalid} invalid rows skipped</p>
      <p>{validation.duplicates} duplicate rows skipped</p>
      <dl>
        <dt>Status</dt>
        <dd>Awaiting Review</dd>
      </dl>
      <div className="csv-actions">
        <button type="button" className="btn" onClick={onViewRequests}>
          View Requests
        </button>
        <button type="button" className="btn" onClick={agent.reset}>
          <RotateCcw size={15} />
          Upload Another CSV
        </button>
        <button type="button" className="btn btn--primary" onClick={onTalkToAi}>
          Send Another Request
        </button>
      </div>
    </section>
  )
}
