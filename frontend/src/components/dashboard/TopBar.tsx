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
    <header className="dash-topbar h-14 sm:h-[4.25rem] shrink-0 z-30">
      <div className="h-full flex items-center gap-2 px-3 sm:px-5">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-[var(--auth-radius)] text-[var(--auth-muted)] hover:text-[var(--auth-text)] hover:bg-white/[0.04]"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full dash-live-badge">
          <span className="dash-live-dot" />
          <span className="!text-[11px]">Live</span>
        </div>

        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-5 sm:gap-7 w-max py-1">
            {SYMBOLS.map((symbol, i) => {
              const tick = prices[symbol];
              const price = tick ? parseFloat(tick.price) : null;
              const change = tick ? parseFloat(tick.change) : null;
              const isUp = change !== null ? change >= 0 : true;

              return (
                <div key={symbol} className="flex items-center gap-2 shrink-0">
                  <span className="dash-label !text-[10px]">{DISPLAY[i]}</span>
                  <span
                    className={cn(
                      "font-mono text-xs sm:text-sm font-semibold tabular-nums",
                      isUp ? "text-[var(--auth-accent)]" : "text-[#f87171]",
                    )}
                  >
                    {price !== null ? formatPrice(price) : "…"}
                  </span>
                  {change !== null && (
                    <span
                      className={cn(
                        "hidden md:inline-flex text-[10px] font-bold items-center gap-0.5 px-1.5 py-0.5 rounded-md",
                        isUp ? "dash-change-up" : "dash-change-down",
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
          <div className="hidden md:flex items-center gap-2 rounded-[var(--auth-radius)] px-3 py-2 border border-[var(--auth-border)] bg-[var(--auth-surface)]">
            <Search size={14} className="text-[var(--auth-muted)]" />
            <input
              type="text"
              placeholder="Search…"
              className="bg-transparent text-xs text-[var(--auth-text)] placeholder-[var(--auth-muted)] outline-none w-24"
            />
          </div>
          <button
            type="button"
            className="relative p-2.5 rounded-[var(--auth-radius)] text-[var(--auth-muted)] hover:text-[var(--auth-text)] hover:bg-white/[0.04] transition-colors"
          >
            <Bell size={17} />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-[var(--auth-bg)]"
              style={{ background: "var(--auth-accent)" }}
            />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-[var(--auth-radius)] hover:bg-white/[0.04] border border-transparent hover:border-[var(--auth-border)] transition-all"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #00ffa3 0%, #00e693 100%)",
                boxShadow: "0 0 16px rgba(0, 255, 163, 0.35)",
              }}
            >
              <User size={14} style={{ color: "#041510" }} />
            </div>
            <span className="hidden md:block text-xs font-semibold text-[var(--auth-text)]">
              Trader
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
