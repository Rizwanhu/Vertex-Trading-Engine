"use client";
import { usePriceFeed } from "@/lib/usePriceFeed";
import { formatPercent, formatPrice, symbolLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { TrendingDown, TrendingUp } from "lucide-react";

const PAIRS = [
  { symbol: "BTCUSDT", short: "BTC" },
  { symbol: "ETHUSDT", short: "ETH" },
  { symbol: "SOLUSDT", short: "SOL" },
  { symbol: "BNBUSDT", short: "BNB" },
];

interface MarketWatchlistProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

export function MarketWatchlist({ activeSymbol, onSelect }: MarketWatchlistProps) {
  const prices = usePriceFeed(PAIRS.map((p) => p.symbol));

  return (
    <div className="flex flex-col min-h-[480px]">
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {PAIRS.map(({ symbol, short }) => {
          const tick = prices[symbol];
          const price = tick ? parseFloat(tick.price) : null;
          const change = tick ? parseFloat(tick.change) : null;
          const isUp = change !== null ? change >= 0 : true;
          const active = activeSymbol === symbol;

          return (
            <button
              key={symbol}
              type="button"
              onClick={() => onSelect(symbol)}
              className={cn("dash-market-row", active && "dash-market-row-active")}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      active
                        ? "bg-[var(--auth-accent-dim)] text-[var(--auth-accent)] border border-[rgba(0,255,163,0.3)]"
                        : "bg-[var(--auth-surface-2)] text-[var(--auth-label)] border border-[var(--auth-border)]",
                    )}
                  >
                    {short}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="dash-market-symbol truncate">{symbolLabel(symbol)}</p>
                    <p className="text-[10px] text-[var(--auth-muted)] mt-0.5">{short}/USDT</p>
                  </div>
                </div>
                <div className="dash-sparkline-wrap">
                  <MiniSparkline positive={isUp} accent size="sm" />
                </div>
              </div>
              <div className="flex items-center justify-between pl-11">
                <span className="dash-market-price">
                  {price !== null ? formatPrice(price) : "—"}
                </span>
                {change !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-bold",
                      isUp ? "text-[var(--auth-accent)]" : "text-[#f87171]",
                    )}
                  >
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {formatPercent(change)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
