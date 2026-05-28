"use client";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, symbolLabel } from "@/lib/format";
import type { PriceTick } from "@/lib/usePriceFeed";
import { TimeframePills } from "@/components/ui/TimeframePills";
import { TrendingDown, TrendingUp } from "lucide-react";

const DEFAULT_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

interface ChartHeaderProps {
  symbol: string;
  tick?: PriceTick | null;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  timeframes?: string[];
  symbolSelector?: React.ReactNode;
  className?: string;
}

export function ChartHeader({
  symbol,
  tick,
  timeframe,
  onTimeframeChange,
  timeframes = DEFAULT_TIMEFRAMES,
  symbolSelector,
  className,
}: ChartHeaderProps) {
  const price = tick ? parseFloat(tick.price) : 0;
  const change = tick ? parseFloat(tick.change) : 0;
  const isUp = change >= 0;

  return (
    <div
      className={cn(
        "p-3 sm:p-4 border-b border-bg-border bg-bg-elevated shrink-0",
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
        {symbolSelector ?? (
          <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">
            {symbolLabel(symbol)}
          </h2>
        )}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm sm:text-base font-mono font-semibold tabular-nums",
              price > 0 ? (isUp ? "text-green-trade" : "text-red-trade") : "text-text-muted",
            )}
          >
            {price > 0 ? formatPrice(price) : "…"}
          </span>
          {tick && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                isUp ? "text-green-trade bg-green-trade/10" : "text-red-trade bg-red-trade/10",
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPercent(change)}
            </span>
          )}
        </div>
      </div>
      <TimeframePills
        timeframes={timeframes}
        active={timeframe}
        onChange={onTimeframeChange}
        className="max-w-full"
      />
    </div>
  );
}
