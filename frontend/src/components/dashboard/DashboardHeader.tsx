"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Bot, Zap } from "lucide-react";
import { symbolLabel, formatPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PriceTick } from "@/lib/usePriceFeed";

interface DashboardHeaderProps {
  symbol: string;
  tick?: PriceTick | null;
  balance?: string;
  todayPnl?: string;
  botsLive?: string;
}

export function DashboardHeader({
  symbol,
  tick,
  balance = "—",
  todayPnl = "—",
  botsLive = "—",
}: DashboardHeaderProps) {
  const price = tick ? parseFloat(tick.price) : 0;
  const change = tick ? parseFloat(tick.change) : 0;
  const isUp = change >= 0;

  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="dash-hero"
    >
      <div className="flex flex-col gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="auth-brand">
            <div className="auth-brand-dot" />
            <span className="auth-brand-name">AlgoTrader</span>
          </div>
          <span className="dash-live-badge">
            <span className="dash-live-dot" />
            Live
          </span>
        </div>

        <div>
          <p className="dash-label mb-2">Active pair</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="dash-heading">{symbolLabel(symbol)}</h1>
            <span className="dash-hero-price">
              {price > 0 ? formatPrice(price) : "—"}
            </span>
            {tick && (
              <span
                className={cn(
                  "dash-change-pill",
                  isUp ? "dash-change-up" : "dash-change-down",
                )}
              >
                {formatPercent(change)} · 24h
              </span>
            )}
          </div>
          <p className="dash-subheading mt-2">
            Monitor markets, execute trades, and supervise your automated strategies in one workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 sm:gap-10 pt-2 border-t border-[var(--auth-border)]">
          {[
            { label: "Balance", value: balance },
            { label: "Today P&L", value: todayPnl },
            { label: "Bots live", value: botsLive },
          ].map((s) => (
            <div key={s.label} className="dash-hero-stat">
              <span className="dash-label">{s.label}</span>
              <p className="dash-hero-stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 shrink-0">
        <Link href="/dashboard/trade" className="dash-btn-primary">
          <Zap size={16} /> Quick trade
        </Link>
        <Link href="/dashboard/bots" className="dash-btn-ghost">
          Manage bots <ArrowUpRight size={14} />
        </Link>
      </div>
    </motion.header>
  );
}
