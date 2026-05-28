interface ChartTooltipProps {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (v) => `$${v.toFixed(2)}`,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const displayLabel = labelFormatter && label ? labelFormatter(label) : label;

  return (
    <div className="rounded-lg border border-bg-border bg-bg-card/95 backdrop-blur px-3 py-2 shadow-card text-xs">
      {displayLabel && <p className="text-text-muted mb-1">{displayLabel}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-mono font-semibold text-text-primary" style={{ color: entry.color }}>
          {formatter(entry.value)}
        </p>
      ))}
    </div>
  );
}
