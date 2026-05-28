"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { api, PnL } from "@/lib/api";
import { DashSubHero } from "@/components/dashboard/ui/DashSubHero";
import { DashStatCard } from "@/components/dashboard/ui/DashStatCard";
import { DashSection } from "@/components/dashboard/ui/DashSection";
import { DashLoading } from "@/components/dashboard/ui/DashLoading";
import { MetricRing } from "@/components/ui/MetricRing";
import { WinLossPie, PnLBarChart } from "@/components/charts/PerformanceCharts";
import { formatSignedCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setPnL(await api.portfolio.pnl());
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
    return <DashLoading label="Loading analytics…" />;
  }

  return (
    <div className="dash-subpage dash-analytics-page">
      <DashSubHero
        badge="Performance Intelligence"
        title={
          <>
            Trading <span>Analytics</span>
          </>
        }
        description="Deep performance metrics, win/loss distribution, and P&L breakdown across all filled orders."
        stats={[
          { label: "Win rate", value: `${pnl?.win_rate ?? 0}%` },
          { label: "Total trades", value: String(pnl?.total_trades ?? 0) },
          { label: "Net P&L", value: formatSignedCurrency(pnl?.total_pnl) },
        ]}
      />

      <section className="dash-subpage-section">
        <div className="dash-subpage-stat-grid">
          <DashStatCard
            title="Win rate"
            value={`${pnl?.win_rate ?? 0}%`}
            sub={`${pnl?.winning_trades ?? 0} wins of ${pnl?.total_trades ?? 0}`}
            trend={(pnl?.win_rate ?? 0) >= 50 ? "up" : "down"}
            icon={Target}
            highlight
            index={0}
          />
          <DashStatCard
            title="Total P&L"
            value={formatSignedCurrency(pnl?.total_pnl)}
            sub="All filled orders"
            trend={(pnl?.total_pnl ?? 0) >= 0 ? "up" : "down"}
            icon={TrendingUp}
            index={1}
          />
          <DashStatCard
            title="Today's P&L"
            value={formatSignedCurrency(pnl?.today_pnl)}
            sub={`${formatPercent(pnl?.today_pnl_pct ?? 0)} of account`}
            trend={(pnl?.today_pnl ?? 0) >= 0 ? "up" : "down"}
            icon={Activity}
            index={2}
          />
          <DashStatCard
            title="Total trades"
            value={String(pnl?.total_trades ?? 0)}
            sub={`${losingTrades} losses`}
            trend="neutral"
            icon={BarChart3}
            index={3}
          />
        </div>
      </section>

      <section className="dash-subpage-section dash-analytics-rings">
        <div className="dash-metric-card dash-metric-card--center">
          <MetricRing value={pnl?.win_rate ?? 0} label="Win rate" color="#00ffa3" size={140} />
        </div>
        <div className="dash-metric-card dash-metric-card--wide">
          <div className="dash-analytics-rings-inner">
            <MetricRing
              value={pnl?.winning_trades ?? 0}
              max={Math.max(pnl?.total_trades ?? 1, 1)}
              label="Wins"
              color="#60a5fa"
              size={100}
            />
            <MetricRing
              value={losingTrades}
              max={Math.max(pnl?.total_trades ?? 1, 1)}
              label="Losses"
              color="#f87171"
              size={100}
            />
            <div className="dash-analytics-winloss-stats">
              <div className="dash-analytics-winloss-row dash-analytics-winloss-row--win">
                <CheckCircle2 size={18} />
                <span className="dash-analytics-winloss-value">{pnl?.winning_trades ?? 0}</span>
                <span className="dash-analytics-winloss-label">wins</span>
              </div>
              <div className="dash-analytics-winloss-row dash-analytics-winloss-row--loss">
                <XCircle size={18} />
                <span className="dash-analytics-winloss-value">{losingTrades}</span>
                <span className="dash-analytics-winloss-label">losses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-subpage-section dash-subpage-grid-2">
        <DashSection title="Win / loss distribution" icon={Target} glow className="dash-chart-panel">
          <div className="dash-chart-panel-body dash-chart-panel-body--pie">
            <WinLossPie pnl={pnl} />
            {pnl && pnl.total_trades > 0 && (
              <div className="dash-pie-center">
                <p className="dash-pie-center-value">{pnl.win_rate}%</p>
                <p className="dash-pie-center-label">Win rate</p>
              </div>
            )}
          </div>
          <div className="dash-chart-legend">
            <span className="dash-chart-legend-item dash-chart-legend-item--win">
              <span className="dash-chart-legend-dot" />
              Wins {pnl?.winning_trades ?? 0}
            </span>
            <span className="dash-chart-legend-item dash-chart-legend-item--loss">
              <span className="dash-chart-legend-dot" />
              Losses {losingTrades}
            </span>
          </div>
        </DashSection>

        <DashSection title="P&L comparison" icon={BarChart3} glow className="dash-chart-panel">
          <div className="dash-chart-panel-body">
            <PnLBarChart pnl={pnl} />
          </div>
        </DashSection>
      </section>

      <section className="dash-subpage-section">
        <DashSection title="Performance summary" icon={Zap} glow>
          <div className="dash-summary-grid">
            {[
              {
                label: "Winning trades",
                value: pnl?.winning_trades ?? 0,
                tone: "win",
              },
              {
                label: "Losing trades",
                value: losingTrades,
                tone: "loss",
              },
              {
                label: "Today P&L %",
                value: formatPercent(pnl?.today_pnl_pct ?? 0),
                tone: "neutral",
              },
              {
                label: "Total P&L",
                value: formatSignedCurrency(pnl?.total_pnl),
                tone: (pnl?.total_pnl ?? 0) >= 0 ? "win" : "loss",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn("dash-summary-tile", `dash-summary-tile--${item.tone}`)}
              >
                <p className="dash-summary-tile-label">{item.label}</p>
                <p className="dash-summary-tile-value">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="dash-summary-footnote">
            Run strategy backtests from the API to see Sharpe ratio and max drawdown per strategy.
          </p>
        </DashSection>
      </section>
    </div>
  );
}
