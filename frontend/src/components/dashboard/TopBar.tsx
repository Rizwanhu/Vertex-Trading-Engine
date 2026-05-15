"use client";
import { Bell, Search, User, TrendingUp, TrendingDown } from "lucide-react";
import { usePriceFeed } from "@/lib/usePriceFeed";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
const DISPLAY = ["BTC", "ETH", "BNB", "SOL", "XRP"];

export function TopBar() {
  const prices = usePriceFeed(SYMBOLS);

  return (
    <header className="h-14 bg-bg-secondary border-b border-bg-border flex items-center justify-between px-4 shrink-0">
      {/* Live Ticker — powered by real Binance WebSocket */}
      <div className="flex items-center gap-5 overflow-hidden">
        {SYMBOLS.map((symbol, i) => {
          const tick = prices[symbol];
          const price = tick ? parseFloat(tick.price) : null;
          const change = tick ? parseFloat(tick.change) : null;
          const isUp = change !== null ? change >= 0 : true;

          return (
            <div key={symbol} className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-semibold text-text-secondary">{DISPLAY[i]}</span>
              <span className={`text-xs font-mono font-medium transition-colors ${isUp ? "text-green-trade" : "text-red-trade"}`}>
                {price !== null
                  ? `$${price.toLocaleString(undefined, { minimumFractionDigits: price < 1 ? 4 : 2 })}`
                  : "…"}
              </span>
              {change !== null && (
                <span className={`text-[10px] flex items-center gap-0.5 ${isUp ? "text-green-trade" : "text-red-trade"}`}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(change).toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-bg-card border border-bg-border rounded-lg px-3 py-1.5">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search symbol…"
            className="bg-transparent text-xs text-text-primary placeholder-text-muted outline-none w-28"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full animate-pulse-slow" />
        </button>

        {/* User Avatar */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-all">
          <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="hidden md:block text-xs font-medium text-text-primary">Trader</span>
        </button>
      </div>
    </header>
  );
}
