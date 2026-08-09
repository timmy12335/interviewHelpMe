import "./index.css";

export interface ProgressRingProps {
  value: number;
  total: number;
  /** 直徑（px）。 */
  size?: number;
  /** 是否有待複習項目；有的話環會轉為琥珀色。 */
  due?: boolean;
  label?: string;
}

const STROKE = 3;

/** 以環形進度顯示「已作答 / 總數」。 */
export function ProgressRing({
  value,
  total,
  size = 44,
  due = false,
  label,
}: ProgressRingProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <span
      className={`progress-ring${due ? " is-due" : ""}`}
      role="img"
      aria-label={label ?? `已作答 ${value} 題，共 ${total} 題`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring__track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          className="progress-ring__value"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="progress-ring__text">{Math.round(ratio * 100)}</span>
    </span>
  );
}
