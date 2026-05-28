"use client";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, symbolLabel } from "@/lib/format";
import type { PriceTick } from "@/lib/usePriceFeed";
import { DashSegmented } from "@/components/dashboard/ui/DashSegmented";
import { TrendingDown, TrendingUp } from "lucide-react";

const DEFAULT_TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export interface ChartMarketStats {
  high: number;
  low: number;
  volume: number;
}

interface ChartHeaderProps {
  symbol: string;
  tick?: PriceTick | null;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  timeframes?: string[];
  symbolSelector?: React.ReactNode;
  marketStats?: ChartMarketStats | null;
  className?: string;
}

export function ChartHeader({
  symbol,
  tick,
  timeframe,
  onTimeframeChange,
  timeframes = DEFAULT_TIMEFRAMES,
  symbolSelector,
  marketStats,
  className,
}: ChartHeaderProps) {
  const price = tick ? parseFloat(tick.price) : 0;
  const change = tick ? parseFloat(tick.change) : 0;
  const isUp = change >= 0;

  const formatVol = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);

  return (
    <div className={cn("dash-chart-toolbar shrink-0", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {symbolSelector ?? (
            <h2 className="dash-section-title !text-base">{symbolLabel(symbol)}</h2>
          )}
          <div className="flex items-center gap-2">
            <span className="dash-hero-price !text-lg">
              {price > 0 ? formatPrice(price) : "…"}
            </span>
            {tick && (
              <span
                className={cn(
                  "dash-change-pill",
                  isUp ? "dash-change-up" : "dash-change-down",
                )}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercent(change)}
              </span>
            )}
          </div>
        </div>
        <DashSegmented
          options={timeframes.map((tf) => ({ value: tf, label: tf }))}
          value={timeframe}
          onChange={onTimeframeChange}
          className="max-w-full"
        />
      </div>

      {marketStats && marketStats.high > 0 && (
        <div className="px-4 pb-4 grid grid-cols-3 gap-2.5">
          {[
            { label: "24h High", value: formatPrice(marketStats.high), cls: "text-[var(--auth-accent)]" },
            { label: "24h Low", value: formatPrice(marketStats.low), cls: "text-[#f87171]" },
            { label: "Volume", value: formatVol(marketStats.volume), cls: "text-[var(--auth-text)]" },
          ].map((s) => (
            <div key={s.label} className="dash-metric-cell">
              <p className="dash-metric-label">{s.label}</p>
              <p className={cn("dash-metric-value", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
