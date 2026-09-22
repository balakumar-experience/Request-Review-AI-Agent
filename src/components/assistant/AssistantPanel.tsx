import { Sparkles, Upload } from 'lucide-react'
import { useState } from 'react'
import type { AgentActions } from '../../agent/agentSimulator'
import { isProcessingAgentState, type AgentSnapshot } from '../../agent/agentStates'
import { AgentExperience } from './AgentExperience'
import { ComposerInput } from './ComposerInput'
import { DemoScenarios } from './DemoScenarios'
import { MessageList } from './MessageList'
import { PromptTemplate, type PromptSelection } from './PromptTemplate'

interface AssistantPanelProps {
  snapshot: AgentSnapshot
  actions: AgentActions
  onUploadCsv: () => void
}

export function AssistantPanel({ snapshot, actions, onUploadCsv }: AssistantPanelProps) {
  const [draftSelection, setDraftSelection] = useState<PromptSelection | null>(null)
  const hasThread = snapshot.messages.length > 0
  const processing = isProcessingAgentState(snapshot.state) && !snapshot.readyToPrepare
  const inPreview = snapshot.state === 'preview' || snapshot.state === 'reminder_preview'
  const hideComposer =
    processing ||
    snapshot.state === 'sending' ||
    snapshot.state === 'awaiting_confirmation' ||
    snapshot.state === 'completed' ||
    snapshot.state === 'reminder_found' ||
    snapshot.state === 'reminder_confirmation' ||
    snapshot.state === 'reminder_sending' ||
    snapshot.state === 'reminder_completed' ||
    snapshot.state === 'query_results' ||
    (inPreview && !snapshot.editingWithAi)

  return (
    <section className="assistant">
      {hasThread ? <MessageList messages={snapshot.messages} actions={actions} /> : null}

      {snapshot.state !== 'idle' ? (
        <AgentExperience snapshot={snapshot} actions={actions} />
      ) : null}

      {inPreview && snapshot.editingWithAi ? (
        <div className="ai-edit-suggestions">
          <p>
            <Sparkles size={14} />
            How would you like to change it?
          </p>
          <div>
            {['Make it warmer', 'Make it shorter', 'Make it more professional', 'Change the subject'].map(
              (instruction) => (
                <button
                  key={instruction}
                  type="button"
                  onClick={() => void actions.sendUserMessage(instruction)}
                >
                  {instruction}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}

      {hideComposer ? null : (
        <ComposerInput
          key={`${snapshot.composerDraft}-${snapshot.editingWithAi}-${snapshot.state}`}
          initialValue={snapshot.composerDraft}
          initialSelection={draftSelection}
          variant={hasThread ? 'followup' : 'hero'}
          rows={hasThread ? 3 : 5}
          disabled={snapshot.revisingEmail}
          label={
            inPreview || snapshot.editingWithAi
              ? snapshot.state === 'reminder_preview'
                ? 'How should I change the reminders?'
                : 'How should I change the email?'
              : hasThread
                ? 'Reply to the assistant'
                : 'What would you like to do?'
          }
          submitLabel={inPreview || snapshot.editingWithAi ? 'Update' : hasThread ? 'Send' : 'Prepare Request'}
          hint={inPreview || snapshot.editingWithAi ? '⌘ Enter to update' : '⌘ Enter to prepare'}
          placeholder={
            inPreview || snapshot.editingWithAi
              ? snapshot.state === 'reminder_preview'
                ? 'Make all reminders warmer.'
                : 'Make it warmer.'
              : 'Send Michael Johnson a review request at michael@gmail.com'
          }
          onSubmit={actions.sendUserMessage}
        />
      )}

      {!hasThread && snapshot.state === 'idle' ? (
        <div className="assistant-starters">
          <DemoScenarios
            onSelect={(utterance) => {
              setDraftSelection(null)
              void actions.loadDemoUtterance(utterance)
            }}
          />
          <div className="assistant-upload">
            <span>Or upload multiple requests</span>
            <button type="button" className="btn btn--secondary" onClick={onUploadCsv}>
              <Upload size={15} />
              Upload CSV
            </button>
          </div>
          <details className="prompt-example-disclosure">
            <summary>Customize an example prompt</summary>
            <PromptTemplate
              onUse={(text, selection) => {
                setDraftSelection(selection)
                void actions.loadDemoUtterance(text)
              }}
            />
          </details>
        </div>
      ) : null}
    </section>
  )
}
