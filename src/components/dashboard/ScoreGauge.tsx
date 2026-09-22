interface ScoreGaugeProps {
  score: number
  max: number
}

const RADIUS = 88
const CENTER_X = 104
const CENTER_Y = 104
const ARC_LENGTH = Math.PI * RADIUS

export function ScoreGauge({ score, max }: ScoreGaugeProps) {
  const ratio = Math.min(Math.max(score / max, 0), 1)
  const needleAngle = -90 + ratio * 180

  return (
    <div className="gauge">
      <svg viewBox="0 0 208 126" role="img" aria-label={`Search Rank Score ${score} of ${max}`}>
        <path
          className="gauge__track"
          d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
        />
        <path
          className="gauge__value"
          d={`M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`}
          strokeDasharray={`${ratio * ARC_LENGTH} ${ARC_LENGTH}`}
        />
        <g transform={`rotate(${needleAngle} ${CENTER_X} ${CENTER_Y})`}>
          <polygon
            className="gauge__needle"
            points={`${CENTER_X} ${CENTER_Y - RADIUS + 56} ${CENTER_X - 5} ${CENTER_Y} ${CENTER_X + 5} ${CENTER_Y}`}
          />
        </g>
        <circle className="gauge__pivot" cx={CENTER_X} cy={CENTER_Y} r={6} />
      </svg>

      <div className="gauge__readout">
        <strong>{score}</strong>
        <span>Search Rank Score®</span>
      </div>

      <div className="gauge__bounds">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
