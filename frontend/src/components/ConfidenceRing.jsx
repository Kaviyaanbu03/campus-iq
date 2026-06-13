/**
 * CampusIQ X - Confidence Ring
 * -------------------------------------
 * SVG circular progress ring used to visualize agent confidence
 * scores, academic scores, placement readiness, etc.
 */

export default function ConfidenceRing({ value = 0, size = 64, strokeWidth = 6, color = "#2563eb", label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div className="ciq-ring-wrapper" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--ciq-border)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="ciq-ring-value" style={{ fontSize: size * 0.24 }}>
          {Math.round(clamped)}%
        </span>
      </div>
      {label && (
        <span style={{ fontSize: 12, color: "var(--ciq-text-secondary)", textAlign: "center" }}>
          {label}
        </span>
      )}
    </div>
  );
}
