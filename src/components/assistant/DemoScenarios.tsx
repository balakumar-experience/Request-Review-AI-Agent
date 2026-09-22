import { BellRing, ListChecks, Send, Users } from 'lucide-react'

interface DemoScenariosProps {
  onSelect: (utterance: string) => void
}

const SUGGESTIONS = [
  {
    label: 'Send a review request',
    utterance: 'Send Michael Johnson a review request at michael@gmail.com',
    icon: Send,
  },
  {
    label: 'Send a reminder',
    utterance: 'Send a reminder to Michael Johnson',
    icon: BellRing,
  },
  {
    label: 'Remind pending customers',
    utterance: "Send reminders to everyone who hasn't reviewed yet",
    icon: Users,
  },
  {
    label: 'Show pending requests',
    utterance: 'Show my pending review requests',
    icon: ListChecks,
  },
] as const

export function DemoScenarios({ onSelect }: DemoScenariosProps) {
  return (
    <aside className="demo-scenarios">
      <p className="demo-scenarios__kicker">Try asking</p>
      <div className="demo-scenarios__list">
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon
          return (
            <button
              key={suggestion.label}
              type="button"
              className="demo-scenarios__chip"
              title={suggestion.utterance}
              onClick={() => onSelect(suggestion.utterance)}
            >
              <Icon size={14} />
              {suggestion.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
