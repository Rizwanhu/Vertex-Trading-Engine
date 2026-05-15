"use client";
import { useEffect, useState, useCallback } from "react";
import { Wallet, TrendingUp, Activity, Loader2, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, Balance, PnL, EquityPoint } from "@/lib/api";
import { format } from "date-fns";

export default function PortfolioPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
      // Not authenticated — silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const chartData = equity.map((pt) => ({
    label: (() => { try { return format(new Date(pt.timestamp), "MMM dd"); } catch { return ""; } })(),
    equity: pt.equity,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time balance, P&L, and equity curve from your broker.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="card p-6 bg-gradient-card border-brand/20">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <Wallet size={20} className="text-brand" />
            <h3 className="font-medium">Estimated Balance</h3>
          </div>
          {loading ? (
            <Loader2 size={24} className="animate-spin text-text-muted" />
          ) : (
            <>
              <p className="text-4xl font-mono font-bold text-white mb-2">
                ${balance?.total_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2 py-0.5 rounded font-medium ${(pnl?.today_pnl ?? 0) >= 0 ? "text-green-trade bg-green-trade/10" : "text-red-trade bg-red-trade/10"}`}>
                  {(pnl?.today_pnl ?? 0) >= 0 ? "+" : ""}${pnl?.today_pnl.toFixed(2) ?? "0.00"}
                </span>
                <span className="text-text-muted">Today</span>
              </div>
            </>
          )}
        </div>

        {/* P&L card */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <Activity size={20} />
            <h3 className="font-medium">Total P&L</h3>
          </div>
          {loading ? <Loader2 size={20} className="animate-spin text-text-muted" /> : (
            <>
              <p className={`text-3xl font-mono font-bold mb-2 ${(pnl?.total_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                {(pnl?.total_pnl ?? 0) >= 0 ? "+" : ""}${pnl?.total_pnl.toFixed(2) ?? "0.00"}
              </p>
              <div className="text-sm text-text-muted space-y-1">
                <p>Win Rate: <span className="text-text-primary font-medium">{pnl?.win_rate ?? 0}%</span></p>
                <p>Trades: <span className="text-text-primary font-medium">{pnl?.total_trades ?? 0}</span></p>
              </div>
            </>
          )}
        </div>

        {/* Available balance */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <TrendingUp size={20} />
            <h3 className="font-medium">Available / In Positions</h3>
          </div>
          {loading ? <Loader2 size={20} className="animate-spin text-text-muted" /> : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted mb-1">Available</p>
                <p className="text-2xl font-mono font-bold text-text-primary">
                  ${balance?.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">In Positions</p>
                <p className="text-lg font-mono text-brand">
                  ${balance?.in_positions.toFixed(2) ?? "0.00"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Equity Curve */}
      <div className="card flex flex-col h-[400px]">
        <div className="p-4 border-b border-bg-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand" />
            <h3 className="font-semibold text-text-primary">Equity Curve</h3>
          </div>
          <span className="text-xs text-text-muted">{equity.length} data points</span>
        </div>
        <div className="p-4 flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-text-muted" />
            </div>
          ) : chartData.length < 2 ? (
            <div className="flex items-center justify-center h-full text-sm text-text-muted">
              No trade history yet — place some orders to see your equity curve
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
                <XAxis dataKey="label" stroke="#475569" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131c35", border: "1px solid #1e2d4a", borderRadius: "8px" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Equity"]}
                />
                <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
