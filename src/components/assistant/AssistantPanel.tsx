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
}

export function AssistantPanel({ snapshot, actions }: AssistantPanelProps) {
  const [draftSelection, setDraftSelection] = useState<PromptSelection | null>(null)
  const hasThread = snapshot.messages.length > 0
  const processing = isProcessingAgentState(snapshot.state) && !snapshot.readyToPrepare
  const inPreview = snapshot.state === 'preview'
  const hideComposer =
    processing ||
    snapshot.state === 'sending' ||
    snapshot.state === 'awaiting_confirmation' ||
    snapshot.state === 'completed'

  return (
    <section className="assistant">
      {hasThread ? <MessageList messages={snapshot.messages} actions={actions} /> : null}

      {snapshot.state !== 'idle' ? (
        <AgentExperience snapshot={snapshot} actions={actions} />
      ) : null}

      {!hasThread && snapshot.state === 'idle' ? (
        <PromptTemplate
          onUse={(text, selection) => {
            setDraftSelection(selection)
            void actions.loadDemoUtterance(text)
          }}
        />
      ) : null}

      <DemoScenarios
        onSelect={(utterance) => {
          setDraftSelection(null)
          void actions.loadDemoUtterance(utterance)
        }}
      />

      {hideComposer ? null : (
        <ComposerInput
          key={`${snapshot.composerDraft}-${snapshot.editingWithAi}-${snapshot.state}`}
          initialValue={snapshot.composerDraft}
          initialSelection={draftSelection}
          variant={hasThread ? 'followup' : 'hero'}
          rows={hasThread ? 3 : 6}
          disabled={snapshot.revisingEmail}
          label={
            inPreview || snapshot.editingWithAi
              ? 'How should I change the email?'
              : hasThread
                ? 'Reply to the assistant'
                : 'What would you like to do?'
          }
          submitLabel={inPreview || snapshot.editingWithAi ? 'Update' : hasThread ? 'Send' : 'Prepare Request'}
          hint={inPreview || snapshot.editingWithAi ? '⌘ Enter to update' : '⌘ Enter to prepare'}
          placeholder={
            inPreview || snapshot.editingWithAi
              ? 'Make it warmer.'
              : 'Send Michael Johnson a review request at michael@gmail.com'
          }
          onSubmit={actions.sendUserMessage}
        />
      )}
    </section>
  )
}
