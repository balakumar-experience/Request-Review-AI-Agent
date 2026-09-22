import type { ProcessingStep } from './agentStates'

export const ACTIVITY_STEP_DEFS = [
  { id: 'understand', label: 'Understanding request' },
  { id: 'identify', label: 'Identifying recipient' },
  { id: 'validate_email', label: 'Validating email' },
  { id: 'check_eligibility', label: 'Checking request eligibility' },
  { id: 'prepare', label: 'Preparing review request' },
  { id: 'wait_confirmation', label: 'Waiting for confirmation' },
] as const

export type ActivityStepId = (typeof ACTIVITY_STEP_DEFS)[number]['id']

export function createActivity(): ProcessingStep[] {
  return ACTIVITY_STEP_DEFS.map((step) => ({
    id: step.id,
    label: step.label,
    status: 'pending',
  }))
}

export function setActivityStep(
  steps: ProcessingStep[],
  id: string,
  status: ProcessingStep['status'],
): ProcessingStep[] {
  return steps.map((step) => (step.id === id ? { ...step, status } : step))
}

export const SENDING_STEP_DEFS = [
  { id: 'prepare_email', label: 'Preparing email...' },
  { id: 'sending', label: 'Sending...' },
  { id: 'delivered', label: 'Delivered ✓' },
] as const

export type SendingStepId = (typeof SENDING_STEP_DEFS)[number]['id']

export function createSendingSteps(): ProcessingStep[] {
  return SENDING_STEP_DEFS.map((step) => ({
    id: step.id,
    label: step.label,
    status: 'pending',
  }))
}

export function isActivityVisible(steps: ProcessingStep[]): boolean {
  return steps.some((step) => step.status !== 'pending')
}
