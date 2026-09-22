import { Check, Loader2 } from 'lucide-react'
import type { ProcessingStep } from '../../agent/agentStates'

interface SendingProgressProps {
  steps: ProcessingStep[]
}

export function SendingProgress({ steps }: SendingProgressProps) {
  return (
    <article className="sending" aria-live="polite">
      <h2 className="sending__title">Sending review request...</h2>
      <ol className="sending__steps">
        {steps.map((step) => (
          <li key={step.id} className={`sending__step sending__step--${step.status}`}>
            <StepMark step={step} />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}

function StepMark({ step }: { step: ProcessingStep }) {
  if (step.status === 'done') {
    return (
      <span className="sending__mark sending__mark--done">
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }

  if (step.status === 'active') {
    return (
      <span className="sending__mark sending__mark--active">
        <Loader2 size={12} className="activity-step__spin" />
      </span>
    )
  }

  return <span className="sending__mark" />
}
