"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { api, PnL } from "@/lib/api";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { MetricRing } from "@/components/ui/MetricRing";
import { WinLossPie, PnLBarChart } from "@/components/charts/PerformanceCharts";
import { formatSignedCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.portfolio.pnl();
      setPnL(data);
    } catch {
      /* AuthGuard */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const losingTrades = pnl ? pnl.total_trades - pnl.winning_trades : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={36} className="animate-spin text-brand" />
        <p className="text-sm text-text-muted font-medium">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <HeroBanner
        badge="Performance Intelligence"
        title={
          <>
            Trading <span className="text-gradient">Analytics</span>
          </>
        }
        description="Deep performance metrics, win/loss distribution, and P&L breakdown across all filled orders."
        stats={[
          { label: "Win Rate", value: `${pnl?.win_rate ?? 0}%` },
          { label: "Total Trades", value: String(pnl?.total_trades ?? 0) },
          { label: "Net P&L", value: formatSignedCurrency(pnl?.total_pnl) },
        ]}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Win Rate" value={`${pnl?.win_rate ?? 0}%`} sub={`${pnl?.winning_trades ?? 0} wins of ${pnl?.total_trades ?? 0}`} trend={(pnl?.win_rate ?? 0) >= 50 ? "up" : "down"} icon={Target} highlight />
        <StatCard title="Total P&L" value={formatSignedCurrency(pnl?.total_pnl)} sub="All filled orders" trend={(pnl?.total_pnl ?? 0) >= 0 ? "up" : "down"} icon={TrendingUp} />
        <StatCard title="Today's P&L" value={formatSignedCurrency(pnl?.today_pnl)} sub={formatPercent(pnl?.today_pnl_pct ?? 0) + " of account"} trend={(pnl?.today_pnl ?? 0) >= 0 ? "up" : "down"} icon={Activity} />
        <StatCard title="Total Trades" value={String(pnl?.total_trades ?? 0)} sub={`${losingTrades} losses`} trend="neutral" icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card flex flex-col items-center justify-center py-6">
          <MetricRing value={pnl?.win_rate ?? 0} label="Win Rate" color="#10b981" size={140} />
        </div>
        <div className="bento-card sm:col-span-2 flex items-center justify-around py-6 gap-4">
          <MetricRing value={pnl?.winning_trades ?? 0} max={Math.max(pnl?.total_trades ?? 1, 1)} label="Wins" color="#3b82f6" size={100} />
          <MetricRing value={losingTrades} max={Math.max(pnl?.total_trades ?? 1, 1)} label="Losses" color="#ef4444" size={100} />
          <div className="hidden md:flex flex-col gap-3">
            <div className="flex items-center gap-2 text-green-trade">
              <CheckCircle2 size={18} />
              <span className="font-mono font-bold text-xl">{pnl?.winning_trades ?? 0}</span>
              <span className="text-sm text-text-muted">wins</span>
            </div>
            <div className="flex items-center gap-2 text-red-trade">
              <XCircle size={18} />
              <span className="font-mono font-bold text-xl">{losingTrades}</span>
              <span className="text-sm text-text-muted">losses</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SectionCard title="Win / Loss Distribution" icon={Target} glow className="min-h-[340px]">
          <div className="relative min-h-[260px]">
            <WinLossPie pnl={pnl} />
            {pnl && pnl.total_trades > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="font-display text-3xl font-bold">{pnl.win_rate}%</p>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wider mt-1">Win rate</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-8 pt-2 text-xs font-semibold">
            <span className="flex items-center gap-2 text-green-trade">
              <span className="w-2.5 h-2.5 rounded-full bg-green-trade shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Wins {pnl?.winning_trades ?? 0}
            </span>
            <span className="flex items-center gap-2 text-red-trade">
              <span className="w-2.5 h-2.5 rounded-full bg-red-trade shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              Losses {losingTrades}
            </span>
          </div>
        </SectionCard>

        <SectionCard title="P&L Comparison" icon={BarChart3} glow className="min-h-[340px]">
          <div className="min-h-[280px]">
            <PnLBarChart pnl={pnl} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Performance Summary" icon={Zap} glow>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Winning Trades", value: pnl?.winning_trades ?? 0, color: "text-green-trade", bg: "from-green-trade/10" },
            { label: "Losing Trades", value: losingTrades, color: "text-red-trade", bg: "from-red-trade/10" },
            { label: "Today P&L %", value: formatPercent(pnl?.today_pnl_pct ?? 0), color: "text-text-primary", bg: "from-brand/10" },
            { label: "Total P&L", value: formatSignedCurrency(pnl?.total_pnl), color: (pnl?.total_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade", bg: "from-brand/10" },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "p-4 sm:p-5 rounded-xl border border-white/[0.06] bg-gradient-to-br to-transparent",
                item.bg,
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">{item.label}</p>
              <p className={cn("font-display text-2xl font-bold tabular-nums", item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-6 pt-4 border-t border-white/[0.06] leading-relaxed">
          Run strategy backtests from the API to see Sharpe ratio and max drawdown per strategy.
        </p>
      </SectionCard>
    </div>
  );
}
