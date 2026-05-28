"use client";
import { useMemo } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DepthBookProps {
  price: number;
  className?: string;
}

interface DepthRow {
  price: number;
  amount: number;
  total: number;
  pct: number;
}

function buildLevels(mid: number, side: "ask" | "bid", count = 8): DepthRow[] {
  if (!mid || mid <= 0) return [];
  const step = mid * 0.00015;
  const rows: DepthRow[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const offset = step * (i + 1);
    const p = side === "ask" ? mid + offset : mid - offset;
    const amount = +(Math.random() * 2.5 + 0.08).toFixed(4);
    total += amount * p;
    rows.push({ price: p, amount, total, pct: 0 });
  }
  const maxAmt = Math.max(...rows.map((r) => r.amount), 0.001);
  return rows.map((r) => ({ ...r, pct: (r.amount / maxAmt) * 100 }));
}

function DepthColumn({ title, rows, side }: { title: string; rows: DepthRow[]; side: "ask" | "bid" }) {
  const isAsk = side === "ask";

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="dash-depth-header">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex-1 min-h-[160px]">
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--auth-muted)] text-center py-8">Waiting for price…</p>
        ) : (
          <div className={cn("flex flex-col", isAsk && "flex-col-reverse")}>
            {rows.map((row, i) => (
              <div key={`${side}-${i}`} className="dash-depth-row">
                <div
                  className={isAsk ? "dash-depth-bar-ask" : "dash-depth-bar-bid"}
                  style={{ width: `${row.pct}%` }}
                />
                <span
                  className={cn(
                    "relative z-10",
                    isAsk ? "text-[#f87171]" : "text-[var(--auth-accent)]",
                  )}
                >
                  {formatPrice(row.price)}
                </span>
                <span className="relative z-10 text-right text-[var(--auth-label)]">
                  {row.amount.toFixed(4)}
                </span>
                <span className="relative z-10 text-right text-[var(--auth-muted)]">
                  {(row.total / 1000).toFixed(2)}k
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="px-4 py-2 text-[10px] font-semibold text-[var(--auth-muted)] border-t border-[var(--auth-border)]">
        {title}
      </p>
    </div>
  );
}

export function DepthBook({ price, className }: DepthBookProps) {
  const asks = useMemo(() => buildLevels(price, "ask"), [price]);
  const bids = useMemo(() => buildLevels(price, "bid"), [price]);

  return (
    <div
      className={cn(
        "grid grid-cols-2 divide-x divide-[var(--auth-border)]",
        className,
      )}
    >
      <DepthColumn title="Sell orders" rows={asks} side="ask" />
      <DepthColumn title="Buy orders" rows={bids} side="bid" />
    </div>
  );
}
