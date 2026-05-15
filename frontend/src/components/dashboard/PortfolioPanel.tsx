"use client";
import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Loader2, RefreshCw } from "lucide-react";
import { api, Balance, PnL } from "@/lib/api";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, positive, icon }: StatCardProps) {
  return (
    <div className="card-elevated p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className={`text-lg font-mono font-bold truncate ${
          positive === true ? "text-green-trade" :
          positive === false ? "text-red-trade" :
          "text-text-primary"
        }`}>
          {value}
        </p>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

export function PortfolioPanel() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [b, p] = await Promise.all([api.portfolio.balance(), api.portfolio.pnl()]);
      setBalance(b);
      setPnL(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="card-elevated p-6 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-4 text-center text-red-trade text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-text-primary">Portfolio</h3>
        <button onClick={fetchData} className="p-1.5 rounded hover:bg-bg-secondary text-text-muted transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Balance"
          value={`$${balance?.total_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}`}
          sub={`${balance?.currency ?? "USDT"}`}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Available"
          value={`$${balance?.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "—"}`}
          sub={`In positions: $${balance?.in_positions.toFixed(2) ?? "0"}`}
          icon={<BarChart2 size={18} />}
        />
        <StatCard
          label="Today's P&L"
          value={`${pnl?.today_pnl !== undefined ? (pnl.today_pnl >= 0 ? "+" : "") + pnl.today_pnl.toFixed(2) : "—"}`}
          sub={pnl ? `${pnl.today_pnl_pct >= 0 ? "+" : ""}${pnl.today_pnl_pct}%` : undefined}
          positive={pnl ? pnl.today_pnl >= 0 : null}
          icon={pnl?.today_pnl !== undefined && pnl.today_pnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        />
        <StatCard
          label="Win Rate"
          value={pnl ? `${pnl.win_rate}%` : "—"}
          sub={pnl ? `${pnl.winning_trades}/${pnl.total_trades} trades` : undefined}
          positive={pnl ? pnl.win_rate >= 50 : null}
          icon={<BarChart2 size={18} />}
        />
      </div>

      {pnl && (
        <div className="card-elevated p-4">
          <p className="text-xs text-text-muted mb-2">Total P&L</p>
          <p className={`text-2xl font-mono font-bold ${pnl.total_pnl >= 0 ? "text-green-trade" : "text-red-trade"}`}>
            {pnl.total_pnl >= 0 ? "+" : ""}{pnl.total_pnl.toFixed(2)} USDT
          </p>
          <p className="text-xs text-text-muted mt-1">{pnl.total_trades} total fills</p>
        </div>
      )}
    </div>
  );
}
