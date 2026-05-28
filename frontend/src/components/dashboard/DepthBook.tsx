"use client";
import { useMemo } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DepthBookProps {
  price: number;
}

interface DepthRow {
  price: number;
  amount: number;
  total: number;
  pct: number;
}

function buildLevels(mid: number, side: "ask" | "bid", count = 6): DepthRow[] {
  if (!mid || mid <= 0) return [];
  const step = mid * 0.00012;
  const rows: DepthRow[] = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const offset = step * (i + 1);
    const p = side === "ask" ? mid + offset : mid - offset;
    const amount = +(0.15 + ((i * 7) % 11) * 0.18).toFixed(4);
    total += amount * p;
    rows.push({ price: p, amount, total, pct: 0 });
  }
  const maxAmt = Math.max(...rows.map((r) => r.amount), 0.001);
  return rows.map((r) => ({ ...r, pct: (r.amount / maxAmt) * 100 }));
}

function DepthRows({ rows, side }: { rows: DepthRow[]; side: "ask" | "bid" }) {
  const isAsk = side === "ask";

  if (rows.length === 0) return null;

  return (
    <>
      <div className="dash-depth-header">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>
      <div className={cn("flex flex-col", isAsk && "flex-col-reverse")}>
        {rows.map((row, i) => (
          <div key={`${side}-${i}`} className="dash-depth-row">
            <div
              className={isAsk ? "dash-depth-bar-ask" : "dash-depth-bar-bid"}
              style={{ width: `${row.pct}%` }}
            />
            <span className={cn("relative z-10", isAsk ? "text-[#f87171]" : "text-[var(--auth-accent)]")}>
              {formatPrice(row.price)}
            </span>
            <span className="relative z-10 text-right text-[var(--auth-label)]">
              {row.amount.toFixed(4)}
            </span>
            <span className="relative z-10 text-right text-[var(--auth-muted)]">
              {(row.total / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export function DepthBook({ price }: DepthBookProps) {
  const asks = useMemo(() => buildLevels(price, "ask"), [price]);
  const bids = useMemo(() => buildLevels(price, "bid"), [price]);

  if (!price || price <= 0) {
    return (
      <div className="dash-orderbook">
        <p className="dash-depth-empty">Connect to live feed for order book depth…</p>
      </div>
    );
  }

  return (
    <div className="dash-orderbook">
      <div className="dash-depth-col">
        <p className="dash-depth-col-title is-ask">Asks · Sell</p>
        <div className="dash-depth-body">
          <DepthRows rows={asks} side="ask" />
        </div>
      </div>
      <div className="dash-depth-col">
        <p className="dash-depth-col-title is-bid">Bids · Buy</p>
        <div className="dash-depth-body">
          <DepthRows rows={bids} side="bid" />
        </div>
      </div>
    </div>
  );
}
