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
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={8} className="metric-ring-track" />
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
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-text-primary tabular-nums">{value}</span>
          {max === 100 && <span className="text-[10px] text-text-muted font-bold">%</span>}
        </div>
      </div>
      <p className="text-xs font-semibold text-text-primary mt-2">{label}</p>
      {sublabel && <p className="text-[10px] text-text-muted">{sublabel}</p>}
    </div>
  );
}
