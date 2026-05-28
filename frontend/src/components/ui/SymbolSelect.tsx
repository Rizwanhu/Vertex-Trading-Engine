"use client";
import { cn } from "@/lib/utils";
import { symbolLabel } from "@/lib/format";

export const TRADING_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
] as const;

interface SymbolSelectProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
  variant?: "select" | "pills";
}

export function SymbolSelect({
  value,
  onChange,
  className,
  variant = "select",
}: SymbolSelectProps) {
  if (variant === "pills") {
    return (
      <div className={cn("dash-symbol-pills", className)}>
        {TRADING_SYMBOLS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              "dash-symbol-pill",
              value === s && "dash-symbol-pill-active",
            )}
          >
            {symbolLabel(s).split("/")[0]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "bg-bg-secondary border border-bg-border rounded-lg px-2 py-1.5",
        "text-sm font-semibold text-text-primary focus:outline-none focus:border-brand",
        className,
      )}
    >
      {TRADING_SYMBOLS.map((s) => (
        <option key={s} value={s}>
          {symbolLabel(s)}
        </option>
      ))}
    </select>
  );
}
