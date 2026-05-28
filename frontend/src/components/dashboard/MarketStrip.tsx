"use client";
import { usePriceFeed } from "@/lib/usePriceFeed";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

const PAIRS = [
  { symbol: "BTCUSDT", label: "Bitcoin", short: "BTC", gradient: "from-orange-500/20 to-orange-600/5" },
  { symbol: "ETHUSDT", label: "Ethereum", short: "ETH", gradient: "from-indigo-500/20 to-indigo-600/5" },
  { symbol: "SOLUSDT", label: "Solana", short: "SOL", gradient: "from-purple-500/20 to-purple-600/5" },
  { symbol: "BNBUSDT", label: "BNB", short: "BNB", gradient: "from-yellow-500/20 to-yellow-600/5" },
];

export function MarketStrip() {
  const prices = usePriceFeed(PAIRS.map((p) => p.symbol));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {PAIRS.map(({ symbol, label, short, gradient }) => {
        const tick = prices[symbol];
        const price = tick ? parseFloat(tick.price) : null;
        const change = tick ? parseFloat(tick.change) : null;
        const isUp = change !== null ? change >= 0 : true;

        return (
          <div
            key={symbol}
            className={cn(
              "glass-panel p-4 sm:p-5 relative overflow-hidden group hover:border-brand/25 transition-all duration-300",
              "bg-gradient-to-br",
              gradient,
            )}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.02] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-colors" />
            <div className="relative flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">{short}</p>
                <p className="text-xs text-text-secondary font-medium">{label}</p>
              </div>
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-display font-bold border",
                  isUp
                    ? "bg-green-trade/10 text-green-trade border-green-trade/25"
                    : "bg-red-trade/10 text-red-trade border-red-trade/25",
                )}
              >
                {short.slice(0, 2)}
              </div>
            </div>
            <p className="relative font-mono text-xl font-bold text-text-primary tabular-nums">
              {price !== null ? formatPrice(price) : "—"}
            </p>
            {change !== null && (
              <p
                className={cn(
                  "relative flex items-center gap-1.5 text-xs font-bold mt-2",
                  isUp ? "text-green-trade" : "text-red-trade",
                )}
              >
                {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {formatPercent(change)}
                <span className="text-text-muted font-normal ml-1">24h</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
