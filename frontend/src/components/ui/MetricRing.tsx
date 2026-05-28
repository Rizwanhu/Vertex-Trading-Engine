"use client";
import { cn } from "@/lib/utils";

interface MetricRingProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
  className?: string;
}

export function MetricRing({
  value,
  max = 100,
  label,
  sublabel,
  color = "#3b82f6",
  size = 120,
  className,
}: MetricRingProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={cn("dash-metric-ring", className)}>
      <div className="dash-metric-ring-svg-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="dash-metric-ring-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={8}
            className="dash-metric-ring-track"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
            className="dash-metric-ring-progress"
          />
        </svg>
        <div className="dash-metric-ring-center">
          <span className="dash-metric-ring-value">{value}</span>
          {max === 100 && <span className="dash-metric-ring-unit">%</span>}
        </div>
      </div>
      <p className="dash-metric-ring-label">{label}</p>
      {sublabel && <p className="dash-metric-ring-sublabel">{sublabel}</p>}
    </div>
  );
}
