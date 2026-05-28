"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, Info, Loader2 } from "lucide-react";
import { api, getToken } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatPrice, formatPercent, symbolBase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashSegmented } from "@/components/dashboard/ui/DashSegmented";

interface TradePanelProps {
  symbol?: string;
  broker?: string;
}

export function TradePanel({ symbol = "BTCUSDT", broker = "binance" }: TradePanelProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("0.001");
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const liveTick = useSymbolPrice(symbol);
  const currentPrice = liveTick ? parseFloat(liveTick.price) : 0;
  const priceChange = liveTick ? parseFloat(liveTick.change) : 0;

  const execPrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || 0);
  const totalValue = (parseFloat(quantity) || 0) * execPrice;

  const setQuantityPct = (pct: number) => {
    const nominalBalance = 1000;
    const qty = (nominalBalance * pct) / (currentPrice || 1);
    setQuantity(qty.toFixed(6));
  };

  const handleTrade = async () => {
    if (!getToken()) {
      toast.error("Please log in first");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error("Enter a valid limit price");
      return;
    }

    setLoading(true);
    try {
      const order = await api.orders.place({
        symbol,
        side,
        order_type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === "limit" ? parseFloat(limitPrice) : null,
        broker,
      });

      toast.success(
        `${side.toUpperCase()} order placed! (#${order.id}) — Risk checked ✓`,
        { duration: 4000 },
      );
      setQuantity("0.001");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-card dash-card-glow flex flex-col min-h-[440px] overflow-hidden">
      <div className="dash-section-head">
        <div>
          <h3 className="dash-section-title">Place order</h3>
          <p className="dash-section-sub">
            {symbol.replace("USDT", "/USDT")} · {broker}
          </p>
        </div>
        <div className="text-right px-3 py-2 rounded-[var(--auth-radius)] bg-[var(--auth-surface-2)] border border-[var(--auth-border)]">
          <p className="dash-market-price text-sm">
            {currentPrice > 0 ? formatPrice(currentPrice) : "—"}
          </p>
          {liveTick && (
            <p
              className={cn(
                "text-xs font-bold font-mono mt-0.5",
                priceChange >= 0 ? "text-[var(--auth-accent)]" : "text-[#f87171]",
              )}
            >
              {formatPercent(priceChange)}
            </p>
          )}
        </div>
      </div>

      <div className="dash-body flex-1 flex flex-col gap-5 !pt-5">
        <DashSegmented
          options={[
            { value: "market", label: "Market" },
            { value: "limit", label: "Limit" },
          ]}
          value={orderType}
          onChange={setOrderType}
          columns={2}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn("dash-side-btn", side === "buy" && "dash-side-btn-buy-active")}
          >
            <ArrowUpCircle size={18} /> Buy
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={cn("dash-side-btn", side === "sell" && "dash-side-btn-sell-active")}
          >
            <ArrowDownCircle size={18} /> Sell
          </button>
        </div>

        <div className="space-y-4 flex-1">
          {orderType === "limit" && (
            <div>
              <label className="dash-field-label" htmlFor="limit-price">
                Limit price (USDT)
              </label>
              <input
                id="limit-price"
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                className="dash-input"
                step="0.01"
              />
            </div>
          )}

          <div>
            <label className="dash-field-label" htmlFor="qty">
              Quantity ({symbolBase(symbol)})
            </label>
            <input
              id="qty"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="dash-input"
              step="0.001"
              min="0"
            />
            <div className="flex gap-1.5 mt-2.5">
              {[["25%", 0.25], ["50%", 0.5], ["75%", 0.75], ["Max", 1]].map(([label, pct]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => setQuantityPct(pct as number)}
                  className="flex-1 py-2 text-[10px] font-bold rounded-lg border border-[var(--auth-border)] text-[var(--auth-muted)] hover:text-[var(--auth-accent)] hover:border-[rgba(0,255,163,0.3)] hover:bg-[var(--auth-accent-dim)] transition-all"
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-5 border-t border-[var(--auth-border)] space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-[var(--auth-radius)] bg-[var(--auth-surface-2)] border border-[var(--auth-border)]">
            <span className="text-sm text-[var(--auth-muted)]">Est. total</span>
            <span className="font-mono font-semibold text-[var(--auth-text)] tabular-nums">
              ~ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>

          <div className="dash-info-banner">
            <Info size={15} className="shrink-0 mt-0.5" />
            <p>Risk engine: max 2% position · 1.5% stop loss · live WebSocket</p>
          </div>

          <button
            type="button"
            onClick={handleTrade}
            disabled={loading}
            className={cn(
              side === "buy" ? "dash-btn-buy" : "dash-btn-sell",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Validating…
              </span>
            ) : side === "buy" ? (
              "Execute buy"
            ) : (
              "Execute sell"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
