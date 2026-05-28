"use client";
import { usePriceFeed } from "@/lib/usePriceFeed";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { TrendingDown, TrendingUp } from "lucide-react";

const PAIRS = [
  { symbol: "BTCUSDT", label: "Bitcoin", short: "BTC" },
  { symbol: "ETHUSDT", label: "Ethereum", short: "ETH" },
  { symbol: "SOLUSDT", label: "Solana", short: "SOL" },
  { symbol: "BNBUSDT", label: "BNB", short: "BNB" },
];

interface MarketStripProps {
  activeSymbol?: string;
  onSelect?: (symbol: string) => void;
}

export function MarketStrip({ activeSymbol, onSelect }: MarketStripProps) {
  const prices = usePriceFeed(PAIRS.map((p) => p.symbol));

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PAIRS.map(({ symbol, label, short }) => {
        const tick = prices[symbol];
        const price = tick ? parseFloat(tick.price) : null;
        const change = tick ? parseFloat(tick.change) : null;
        const isUp = change !== null ? change >= 0 : true;
        const active = activeSymbol === symbol;
        const Tag = onSelect ? "button" : "div";

        return (
          <Tag
            key={symbol}
            type={onSelect ? "button" : undefined}
            onClick={onSelect ? () => onSelect(symbol) : undefined}
            className={cn(
              "dash-market-row !p-3",
              active && "dash-market-row-active",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="text-left">
                <p className="dash-label">{short}</p>
                <p className="text-xs text-[var(--auth-muted)] mt-0.5">{label}</p>
              </div>
              <MiniSparkline positive={isUp} accent />
            </div>
            <p className="dash-market-price text-base">{price !== null ? formatPrice(price) : "—"}</p>
            {change !== null && (
              <p
                className={cn(
                  "flex items-center gap-1 text-[11px] font-bold mt-1.5",
                  isUp ? "text-[var(--auth-accent)]" : "text-[#f87171]",
                )}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatPercent(change)}
              </p>
            )}
          </Tag>
        );
      })}
    </div>
  );
}
