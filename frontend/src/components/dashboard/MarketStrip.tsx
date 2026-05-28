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

interface MarketStripProps {
  activeSymbol?: string;
  onSelect?: (symbol: string) => void;
}

export function MarketStrip({ activeSymbol, onSelect }: MarketStripProps) {
  const prices = usePriceFeed(PAIRS.map((p) => p.symbol));
  const active = PAIRS.find((p) => p.symbol === activeSymbol) ?? PAIRS[0];
  const activeTick = prices[active.symbol];
  const activePrice = activeTick ? parseFloat(activeTick.price) : null;
  const activeChange = activeTick ? parseFloat(activeTick.change) : null;
  const activeUp = activeChange !== null ? activeChange >= 0 : true;

  return (
    <div className="flex flex-col gap-2">
      {/* Featured active pair — full width */}
      <button
        type="button"
        onClick={() => onSelect?.(active.symbol)}
        className="dash-market-tile dash-market-tile-hero is-active"
      >
        <div className="dash-market-tile-top">
          <div className="text-left">
            <p className="dash-label">{active.short}</p>
            <p className="dash-market-symbol text-base">{symbolLabel(active.symbol)}</p>
          </div>
          <div className="dash-sparkline-wrap">
            <MiniSparkline positive={activeUp} accent size="sm" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 mt-1">
          <span className="dash-hero-price !text-xl">
            {activePrice !== null ? formatPrice(activePrice) : "—"}
          </span>
          {activeChange !== null && (
            <span
              className={cn(
                "dash-change-pill",
                activeUp ? "dash-change-up" : "dash-change-down",
              )}
            >
              {activeUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {formatPercent(activeChange)}
            </span>
          )}
        </div>
      </button>

      {/* Other pairs — horizontal scroll */}
      <div className="dash-market-scroll">
        {PAIRS.filter((p) => p.symbol !== activeSymbol).map(({ symbol, short }) => {
          const tick = prices[symbol];
          const price = tick ? parseFloat(tick.price) : null;
          const change = tick ? parseFloat(tick.change) : null;
          const isUp = change !== null ? change >= 0 : true;

          return (
            <button
              key={symbol}
              type="button"
              onClick={() => onSelect?.(symbol)}
              className="dash-market-tile"
            >
              <div className="dash-market-tile-top">
                <span className="dash-label">{short}</span>
                <div className="dash-sparkline-wrap">
                  <MiniSparkline positive={isUp} accent size="sm" />
                </div>
              </div>
              <span className="dash-market-price text-sm">
                {price !== null ? formatPrice(price) : "—"}
              </span>
              {change !== null && (
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1",
                    isUp ? "text-[var(--auth-accent)]" : "text-[#f87171]",
                  )}
                >
                  {formatPercent(change)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
