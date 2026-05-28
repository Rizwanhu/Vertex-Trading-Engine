"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="dash-hero"
    >
      <div className="dash-hero-main">
        <div className="dash-hero-top">
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
          <p className="dash-label">Active pair</p>
          <div className="dash-hero-pair-row">
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
        </div>

        <div className="dash-hero-stats-row">
          {[
            { label: "Balance", value: balance },
            { label: "Today P&L", value: todayPnl },
            { label: "Bots live", value: botsLive },
          ].map((s) => (
            <div key={s.label} className="dash-hero-stat-pill">
              <span className="dash-label">{s.label}</span>
              <p className="dash-hero-stat-value">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-hero-actions">
        <Link href="/dashboard/trade" className="dash-btn-primary">
          <Zap size={16} /> Quick trade
        </Link>
        <Link href="/dashboard/bots" className="dash-btn-ghost">
          Bots <ArrowUpRight size={14} />
        </Link>
      </div>
    </motion.header>
  );
}
