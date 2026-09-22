import { DEMO_SCENARIOS } from '../../data/demoScenarios'

interface DemoScenariosProps {
  onSelect: (utterance: string) => void
}

export function DemoScenarios({ onSelect }: DemoScenariosProps) {
  return (
    <aside className="demo-scenarios">
      <p className="demo-scenarios__kicker">Demo Scenarios</p>
      <div className="demo-scenarios__list">
        {DEMO_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="demo-scenarios__chip"
            title={scenario.utterance}
            onClick={() => onSelect(scenario.utterance)}
          >
            {scenario.label}
          </button>
        ))}
      </div>
    </aside>
  )
}
