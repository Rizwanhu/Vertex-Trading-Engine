"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  Activity,
  RefreshCw,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { api, Balance, PnL, EquityPoint } from "@/lib/api";
import { DashSubHero } from "@/components/dashboard/ui/DashSubHero";
import { DashStatCard } from "@/components/dashboard/ui/DashStatCard";
import { DashSection } from "@/components/dashboard/ui/DashSection";
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
    <div className="dash-subpage dash-portfolio-page">
      <DashSubHero
        badge="Wealth Management"
        title={
          <>
            Your <span>Portfolio</span>
          </>
        }
        description="Track balance, performance, and capital allocation across all positions."
        stats={[
          {
            label: "Equity",
            value: loading ? "…" : formatCurrency(balance?.total_balance),
          },
          {
            label: "Today",
            value: loading ? "…" : formatSignedCurrency(pnl?.today_pnl),
          },
          {
            label: "Win rate",
            value: pnl ? `${pnl.win_rate}%` : "—",
          },
        ]}
        actions={
          <button
            type="button"
            onClick={() => fetchData(true)}
            className={cn("dash-icon-btn-ghost", refreshing && "dash-icon-btn-ghost--spin")}
            title="Refresh portfolio"
            aria-label="Refresh portfolio"
          >
            <RefreshCw size={18} />
          </button>
        }
      />

      <section className="dash-subpage-section">
        <div className="dash-equity-hero dash-card dash-card-glow">
          <div className="dash-equity-hero-main">
            <p className="dash-label">Total equity</p>
            <p className="dash-equity-value">
              {loading ? "…" : formatCurrency(balance?.total_balance)}
            </p>
            <div className="dash-equity-today">
              <span
                className={cn(
                  "dash-change-pill",
                  isUpToday ? "dash-change-up" : "dash-change-down",
                )}
              >
                {isUpToday ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatSignedCurrency(pnl?.today_pnl)} today
              </span>
              <span className="dash-equity-today-pct">{formatPercent(pnl?.today_pnl_pct ?? 0)}</span>
            </div>
          </div>
          <div className="dash-equity-rings">
            <MetricRing
              value={Math.round(inPositionsPct)}
              label="Deployed"
              color="#60a5fa"
              size={108}
            />
            <MetricRing value={pnl?.win_rate ?? 0} label="Win rate" color="#00ffa3" size={108} />
          </div>
        </div>
      </section>

      <section className="dash-subpage-section">
        <div className="dash-subpage-stat-grid dash-subpage-stat-grid--3">
          <DashStatCard
            title="Total P&L"
            value={formatSignedCurrency(pnl?.total_pnl)}
            sub={pnl ? `${pnl.total_trades} trades` : undefined}
            trend={(pnl?.total_pnl ?? 0) >= 0 ? "up" : "down"}
            icon={Activity}
            loading={loading}
            index={0}
          />
          <DashStatCard
            title="Available"
            value={formatCurrency(balance?.available_balance)}
            sub={balance ? `${(100 - inPositionsPct).toFixed(1)}% free` : undefined}
            trend="neutral"
            icon={Wallet}
            loading={loading}
            index={1}
          />
          <DashStatCard
            title="In positions"
            value={formatCurrency(balance?.in_positions)}
            sub={`${inPositionsPct.toFixed(1)}% of portfolio`}
            trend="neutral"
            icon={TrendingUp}
            loading={loading}
            highlight
            index={2}
          />
        </div>
      </section>

      <section className="dash-subpage-section dash-portfolio-charts">
        <DashSection
          title="Equity curve"
          icon={TrendingUp}
          glow
          className="dash-chart-panel dash-portfolio-equity"
          action={
            <span className="dash-section-meta">{equity.length} pts</span>
          }
        >
          <div className="dash-chart-panel-body dash-chart-panel-body--tall">
            <EquityCurveChart data={equity} loading={loading} />
          </div>
        </DashSection>

        <DashSection title="Allocation" icon={PieChart} glow className="dash-portfolio-allocation">
          {loading ? (
            <div className="dash-chart-empty">Loading allocation…</div>
          ) : (
            <div className="dash-allocation-body">
              <div className="dash-allocation-bar-block">
                <div className="dash-allocation-bar-head">
                  <span className="dash-allocation-bar-label">Capital deployed</span>
                  <span className="dash-allocation-bar-pct">{inPositionsPct.toFixed(1)}%</span>
                </div>
                <div className="dash-allocation-track">
                  <div
                    className="dash-allocation-fill"
                    style={{ width: `${Math.min(100, inPositionsPct)}%` }}
                  />
                </div>
                <div className="dash-allocation-track-labels">
                  <span>Cash</span>
                  <span>Positions</span>
                </div>
              </div>

              <dl className="dash-allocation-list">
                {[
                  {
                    label: "Available cash",
                    value: formatCurrency(balance?.available_balance),
                    tone: "default",
                  },
                  {
                    label: "In positions",
                    value: formatCurrency(balance?.in_positions),
                    tone: "accent",
                  },
                  {
                    label: "Winning trades",
                    value: String(pnl?.winning_trades ?? 0),
                    tone: "win",
                  },
                  {
                    label: "Total trades",
                    value: String(pnl?.total_trades ?? 0),
                    tone: "muted",
                  },
                ].map((row) => (
                  <div key={row.label} className="dash-allocation-row">
                    <dt className="dash-allocation-row-label">{row.label}</dt>
                    <dd className={cn("dash-allocation-row-value", `dash-allocation-row-value--${row.tone}`)}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </DashSection>
      </section>
    </div>
  );
}
