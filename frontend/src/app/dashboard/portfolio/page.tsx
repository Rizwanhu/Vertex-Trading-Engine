"use client";
import { useEffect, useState, useCallback } from "react";
import { Wallet, TrendingUp, Activity, RefreshCw, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { api, Balance, PnL, EquityPoint } from "@/lib/api";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { StatCard } from "@/components/ui/StatCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { MetricRing } from "@/components/ui/MetricRing";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { formatCurrency, formatSignedCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [b, p, eq] = await Promise.all([
        api.portfolio.balance(),
        api.portfolio.pnl(),
        api.portfolio.equityCurve(),
      ]);
      setBalance(b);
      setPnL(p);
      setEquity(eq);
    } catch {
      /* AuthGuard */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const inPositionsPct =
    balance && balance.total_balance > 0
      ? (balance.in_positions / balance.total_balance) * 100
      : 0;

  const isUpToday = (pnl?.today_pnl ?? 0) >= 0;

  return (
    <div className="page-container">
      <HeroBanner
        badge="Wealth Management"
        title={
          <>
            Your <span className="text-gradient">Portfolio</span>
          </>
        }
        description="Track balance, performance, and capital allocation across all positions."
        actions={
          <button
            type="button"
            onClick={() => fetchData(true)}
            className={cn("btn-ghost p-3", refreshing && "[&_svg]:animate-spin")}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        }
      />

      {/* Hero balance card */}
      <div className="glass-panel-glow p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted mb-2">Total Equity</p>
            <p className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tabular-nums tracking-tight">
              {loading ? "…" : formatCurrency(balance?.total_balance)}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border",
                  isUpToday
                    ? "bg-green-trade/10 text-green-trade border-green-trade/25"
                    : "bg-red-trade/10 text-red-trade border-red-trade/25",
                )}
              >
                {isUpToday ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatSignedCurrency(pnl?.today_pnl)} today
              </span>
              <span className="text-sm text-text-muted">{formatPercent(pnl?.today_pnl_pct ?? 0)}</span>
            </div>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <MetricRing value={Math.round(inPositionsPct)} label="Deployed" color="#3b82f6" />
            <MetricRing value={pnl?.win_rate ?? 0} label="Win Rate" color="#10b981" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total P&L" value={formatSignedCurrency(pnl?.total_pnl)} sub={pnl ? `${pnl.total_trades} trades` : undefined} trend={(pnl?.total_pnl ?? 0) >= 0 ? "up" : "down"} icon={Activity} loading={loading} />
        <StatCard title="Available" value={formatCurrency(balance?.available_balance)} sub={balance ? `${(100 - inPositionsPct).toFixed(1)}% free` : undefined} trend="neutral" icon={Wallet} loading={loading} />
        <StatCard title="In Positions" value={formatCurrency(balance?.in_positions)} sub={`${inPositionsPct.toFixed(1)}% of portfolio`} trend="neutral" icon={TrendingUp} loading={loading} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SectionCard
          title="Equity Curve"
          icon={TrendingUp}
          className="lg:col-span-2 min-h-[400px]"
          glow
          action={<span className="text-[10px] font-bold text-text-muted tabular-nums">{equity.length} PTS</span>}
        >
          <div className="min-h-[320px]">
            <EquityCurveChart data={equity} loading={loading} />
          </div>
        </SectionCard>

        <SectionCard title="Allocation" icon={PieChart} glow>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">Loading…</div>
          ) : (
            <div className="space-y-6">
              <div className="relative pt-2">
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-text-muted font-semibold">Capital deployed</span>
                  <span className="font-mono font-bold text-brand">{inPositionsPct.toFixed(1)}%</span>
                </div>
                <div className="h-3 rounded-full bg-black/40 overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-700 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    style={{ width: `${Math.min(100, inPositionsPct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  <span>Cash</span>
                  <span>Positions</span>
                </div>
              </div>

              <div className="space-y-1">
                {[
                  { label: "Available cash", value: formatCurrency(balance?.available_balance), color: "text-text-primary" },
                  { label: "In positions", value: formatCurrency(balance?.in_positions), color: "text-brand" },
                  { label: "Winning trades", value: String(pnl?.winning_trades ?? 0), color: "text-green-trade" },
                  { label: "Total trades", value: String(pnl?.total_trades ?? 0), color: "text-text-secondary" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-3 border-b border-white/[0.05] last:border-0">
                    <span className="text-sm text-text-muted">{row.label}</span>
                    <span className={cn("font-mono font-bold text-sm tabular-nums", row.color)}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
