"use client";
import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api, Balance, PnL } from "@/lib/api";
import { formatCurrency, formatSignedCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PortfolioPanel({ compact }: { compact?: boolean }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([api.portfolio.balance(), api.portfolio.pnl()]);
      setBalance(b);
      setPnL(p);
    } catch {
      /* silent */
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
      <div className="flex items-center justify-center py-8">
        <Loader2 size={22} className="animate-spin text-brand" />
      </div>
    );
  }

  const rows = [
    { label: "Balance", value: formatCurrency(balance?.total_balance) },
    { label: "Available", value: formatCurrency(balance?.available_balance) },
    {
      label: "Today P&L",
      value: formatSignedCurrency(pnl?.today_pnl),
      color: (pnl?.today_pnl ?? 0) >= 0 ? "text-green-trade" : "text-red-trade",
    },
    {
      label: "Win rate",
      value: pnl ? `${pnl.win_rate}%` : "—",
      sub: pnl ? `${pnl.winning_trades}/${pnl.total_trades}` : undefined,
    },
  ];

  if (compact) {
    return (
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between items-baseline gap-2">
            <dt className="text-xs text-text-muted">{r.label}</dt>
            <dd className={cn("font-mono text-sm font-semibold tabular-nums", r.color)}>{r.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="section-title">Portfolio</h3>
        <button type="button" onClick={fetchData} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-text-muted">
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="p-3 rounded-xl bg-bg-secondary/60 border border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{r.label}</p>
            <p className={cn("font-mono font-bold mt-1 tabular-nums", r.color ?? "text-text-primary")}>
              {r.value}
            </p>
            {r.sub && <p className="text-[10px] text-text-muted mt-0.5">{r.sub}</p>}
          </div>
        ))}
      </div>
      {pnl && (
        <div className="p-3 rounded-xl border border-white/[0.06] bg-brand/5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Total P&L</p>
          <p
            className={cn(
              "font-display text-xl font-bold mt-1",
              pnl.total_pnl >= 0 ? "text-green-trade" : "text-red-trade",
            )}
          >
            {formatSignedCurrency(pnl.total_pnl)}
          </p>
          <p className="text-xs text-text-muted mt-1">{formatPercent(pnl.today_pnl_pct)} today</p>
        </div>
      )}
    </div>
  );
}
