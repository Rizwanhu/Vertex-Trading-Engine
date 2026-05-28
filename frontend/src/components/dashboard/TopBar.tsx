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
    <header className="dash-topbar">
      <div className="dash-topbar-inner">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="dash-topbar-menu"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="dash-live-badge hidden sm:inline-flex">
          <span className="dash-live-dot" />
          Live
        </div>

        <div className="dash-ticker-strip">
          {SYMBOLS.map((symbol, i) => {
            const tick = prices[symbol];
            const price = tick ? parseFloat(tick.price) : null;
            const change = tick ? parseFloat(tick.change) : null;
            const isUp = change !== null ? change >= 0 : true;

            return (
              <div key={symbol} className="dash-ticker-item">
                <span className="dash-ticker-symbol">{DISPLAY[i]}</span>
                <span
                  className={cn(
                    "dash-ticker-price",
                    price !== null && (isUp ? "is-up" : "is-down"),
                  )}
                >
                  {price !== null ? formatPrice(price) : "…"}
                </span>
                {change !== null && (
                  <span
                    className={cn(
                      "hidden md:inline-flex dash-change-pill !text-[10px] !py-0 !px-1.5",
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

        <div className="dash-topbar-actions">
          <label className="dash-search">
            <Search size={14} style={{ color: "var(--auth-muted)", flexShrink: 0 }} />
            <input type="search" placeholder="Search markets…" aria-label="Search" />
          </label>

          <button type="button" className="dash-icon-btn" aria-label="Notifications">
            <Bell size={17} />
            <span className="dash-icon-btn-dot" />
          </button>

          <button type="button" className="dash-user-pill">
            <span className="dash-user-avatar">
              <User size={14} strokeWidth={2.5} />
            </span>
            <span className="dash-user-name">Trader</span>
          </button>
        </div>
      </div>
    </header>
  );
}
