"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, TrendingUp, Target, Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, PnL } from "@/lib/api";

export default function AnalyticsPage() {
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.portfolio.pnl();
      setPnL(data);
    } catch {
      // not authenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const losingTrades = pnl ? pnl.total_trades - pnl.winning_trades : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Deep dive into your trading performance and strategy metrics.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={28} className="animate-spin text-brand" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <Target size={16} /> <span className="text-sm font-medium">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{pnl?.win_rate ?? 0}%</p>
              <div className="w-full bg-bg-secondary h-1.5 rounded-full mt-1 overflow-hidden">
                <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${pnl?.win_rate ?? 0}%` }} />
              </div>
            </div>
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <TrendingUp size={16} /> <span className="text-sm font-medium">Total P&L</span>
              </div>
              <p className={`text-2xl font-bold ${(pnl?.total_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                {(pnl?.total_pnl ?? 0) >= 0 ? "+" : ""}${pnl?.total_pnl.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-xs text-text-muted">All filled orders</p>
            </div>
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <Activity size={16} /> <span className="text-sm font-medium">Today&apos;s P&L</span>
              </div>
              <p className={`text-2xl font-bold ${(pnl?.today_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                {(pnl?.today_pnl ?? 0) >= 0 ? "+" : ""}${pnl?.today_pnl.toFixed(2) ?? "0.00"}
              </p>
              <p className="text-xs text-text-muted">{pnl?.today_pnl_pct ?? 0}% of account</p>
            </div>
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <BarChart3 size={16} /> <span className="text-sm font-medium">Total Trades</span>
              </div>
              <p className="text-2xl font-bold text-text-primary">{pnl?.total_trades ?? 0}</p>
              <p className="text-xs flex gap-3 mt-1">
                <span className="flex items-center gap-1 text-green-trade">
                  <CheckCircle2 size={12} /> {pnl?.winning_trades ?? 0}
                </span>
                <span className="flex items-center gap-1 text-red-trade">
                  <XCircle size={12} /> {losingTrades}
                </span>
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-text-primary mb-4">Performance Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-text-muted text-xs">Winning Trades</p>
                <p className="font-mono font-semibold text-green-trade">{pnl?.winning_trades ?? 0}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Losing Trades</p>
                <p className="font-mono font-semibold text-red-trade">{losingTrades}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Today P&L %</p>
                <p className="font-mono font-semibold">{pnl?.today_pnl_pct ?? 0}%</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Total P&L</p>
                <p className={`font-mono font-semibold ${(pnl?.total_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                  ${pnl?.total_pnl.toFixed(2) ?? "0.00"}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Run backtests from the Strategies API to see Sharpe ratio and drawdown per strategy.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
