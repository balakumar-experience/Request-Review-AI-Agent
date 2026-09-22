import type { AgentActions } from '../../agent/agentSimulator'
import type { AgentMessage } from '../../agent/agentStates'
import { UnderstandingCard } from './UnderstandingCard'

interface MessageListProps {
  messages: AgentMessage[]
  actions: AgentActions
}

export function MessageList({ messages, actions }: MessageListProps) {
  const visible = messages.filter((message) => message.kind !== 'processing')

  return (
    <ol className="thread">
      {visible.map((message) => (
        <li key={message.id} className={`thread__row thread__row--${message.role}`}>
          <span className="thread__sender">{message.role === 'user' ? 'You' : 'Assistant'}</span>
          <MessageBody message={message} actions={actions} />
        </li>
      ))}
    </ol>
  )
}

function MessageBody({ message, actions }: { message: AgentMessage; actions: AgentActions }) {
  if (message.kind === 'processing') {
    return null
  }

  if (message.kind === 'text') {
    if (message.role === 'user') {
      return <p className="bubble bubble--user">{message.text}</p>
    }
    return <p className={`bubble bubble--assistant bubble--${message.tone}`}>{message.text}</p>
  }

  return (
    <UnderstandingCard
      summary={message.summary}
      interactive={!message.resolved}
      onEdit={() => void actions.editRequest()}
      onPrepare={() => void actions.prepareRequest()}
    />
  )
}
