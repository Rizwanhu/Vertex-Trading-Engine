"use client";
import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api, Balance, PnL } from "@/lib/api";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
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
      <div className="flex items-center justify-center py-12">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--auth-accent)" }} />
      </div>
    );
  }

  const rows = [
    { label: "Balance", value: formatCurrency(balance?.total_balance) },
    { label: "Available", value: formatCurrency(balance?.available_balance) },
    {
      label: "Today P&L",
      value: formatSignedCurrency(pnl?.today_pnl),
      accent: (pnl?.today_pnl ?? 0) >= 0 ? "var(--auth-accent)" : "#f87171",
    },
    {
      label: "Win rate",
      value: pnl ? `${pnl.win_rate}%` : "—",
      sub: pnl ? `${pnl.winning_trades}/${pnl.total_trades} trades` : undefined,
    },
  ];

  if (compact) {
    return (
      <dl className="dash-portfolio-list">
        {rows.map((r) => (
          <div key={r.label} className="dash-portfolio-row">
            <dt className="dash-portfolio-label">{r.label}</dt>
            <dd className="m-0 p-0">
              <span
                className="dash-portfolio-value"
                style={{ color: r.accent ?? "var(--auth-text)" }}
              >
                {r.value}
              </span>
              {r.sub && <p className="dash-portfolio-sub">{r.sub}</p>}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="space-y-5 p-1">
      <div className="flex items-center justify-between">
        <h3 className="dash-section-title">Portfolio</h3>
        <button
          type="button"
          onClick={fetchData}
          className="p-2 rounded-lg text-[var(--auth-muted)] hover:text-[var(--auth-text)] hover:bg-white/[0.04] transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="p-4 rounded-[var(--auth-radius)] bg-[var(--auth-surface-2)] border border-[var(--auth-border)]"
          >
            <p className="dash-portfolio-label">{r.label}</p>
            <p
              className="dash-portfolio-value mt-2"
              style={{ color: r.accent }}
            >
              {r.value}
            </p>
            {r.sub && <p className="dash-portfolio-sub">{r.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
