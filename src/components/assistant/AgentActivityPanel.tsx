import { Activity, Check, Loader2 } from 'lucide-react'
import type { ProcessingStep } from '../../agent/agentStates'

interface AgentActivityPanelProps {
  steps: ProcessingStep[]
}

export function AgentActivityPanel({ steps }: AgentActivityPanelProps) {
  const active = steps.find((step) => step.status === 'active')
  const heading = active?.id === 'wait_confirmation' ? 'Waiting on you' : 'Progress'

  return (
    <aside className="activity-panel" aria-live="polite" aria-label="Request progress">
      <p className="activity-panel__kicker">
        <Activity size={14} />
        {heading}
      </p>
      <ol className="activity-panel__list">
        {steps.map((step) => (
          <li key={step.id} className={`activity-step activity-step--${step.status}`}>
            <StepMark step={step} />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}

function StepMark({ step }: { step: ProcessingStep }) {
  if (step.status === 'done') {
    return (
      <span className="activity-step__mark activity-step__mark--done">
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }

  if (step.status === 'active' && step.id === 'wait_confirmation') {
    return <span className="activity-step__mark activity-step__mark--wait" />
  }

  if (step.status === 'active') {
    return (
      <span className="activity-step__mark activity-step__mark--active">
        <Loader2 size={12} className="activity-step__spin" />
      </span>
    )
  }

  return <span className="activity-step__mark" />
}
