"use client";
import { Bell, Search, User, TrendingUp, TrendingDown, Menu } from "lucide-react";
import { usePriceFeed } from "@/lib/usePriceFeed";
import { formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
const DISPLAY = ["BTC", "ETH", "BNB", "SOL", "XRP"];

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const prices = usePriceFeed(SYMBOLS);

  return (
    <header className="h-14 sm:h-16 shrink-0 z-30 border-b border-white/[0.06] bg-bg-secondary/80 backdrop-blur-xl">
      <div className="h-full flex items-center gap-2 px-3 sm:px-5">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.05]"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-trade/10 border border-green-trade/20">
          <span className="live-dot" />
          <span className="text-[11px] font-bold text-green-trade uppercase tracking-wide">Live</span>
        </div>

        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-5 sm:gap-6 w-max py-1">
            {SYMBOLS.map((symbol, i) => {
              const tick = prices[symbol];
              const price = tick ? parseFloat(tick.price) : null;
              const change = tick ? parseFloat(tick.change) : null;
              const isUp = change !== null ? change >= 0 : true;

              return (
                <div key={symbol} className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-text-muted">{DISPLAY[i]}</span>
                  <span
                    className={cn(
                      "font-mono text-xs sm:text-sm font-semibold tabular-nums",
                      isUp ? "text-green-trade" : "text-red-trade",
                    )}
                  >
                    {price !== null ? formatPrice(price) : "…"}
                  </span>
                  {change !== null && (
                    <span
                      className={cn(
                        "hidden md:inline-flex text-[10px] font-bold items-center gap-0.5 px-1.5 py-0.5 rounded",
                        isUp ? "text-green-trade bg-green-trade/10" : "text-red-trade bg-red-trade/10",
                      )}
                    >
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {formatPercent(Math.abs(change), false)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-bg-card/80 border border-white/[0.06] rounded-xl px-3 py-2">
            <Search size={14} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search…"
              className="bg-transparent text-xs text-text-primary placeholder-text-muted outline-none w-20"
            />
          </div>
          <button
            type="button"
            className="relative p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/[0.05]"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full ring-2 ring-bg-secondary" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <User size={14} className="text-white" />
            </div>
            <span className="hidden md:block text-xs font-semibold text-text-primary">Trader</span>
          </button>
        </div>
      </div>
    </header>
  );
}
