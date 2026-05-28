"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, Info, Loader2 } from "lucide-react";
import { api, getToken } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatPrice, formatPercent, symbolBase } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  // Live price from WebSocket
  const liveTick = useSymbolPrice(symbol);
  const currentPrice = liveTick ? parseFloat(liveTick.price) : 0;
  const priceChange = liveTick ? parseFloat(liveTick.change) : 0;

  const execPrice = orderType === "market" ? currentPrice : (parseFloat(limitPrice) || 0);
  const totalValue = (parseFloat(quantity) || 0) * execPrice;

  const setQuantityPct = (pct: number) => {
    // Use a nominal balance for percentage calculation
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
        { duration: 4000 }
      );
      // Reset quantity after success
      setQuantity("0.001");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-elevated flex flex-col h-full min-h-[440px] lg:min-h-0 overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between gap-2 bg-white/[0.02]">
        <div>
          <h3 className="font-display font-bold text-text-primary text-lg">Place Order</h3>
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
            {symbol.replace("USDT", "/USDT")} · Binance
          </p>
        </div>
        <div className="text-right px-3 py-2 rounded-xl bg-black/30 border border-white/[0.06]">
          <p className="font-mono text-sm font-bold text-text-primary tabular-nums">
            {currentPrice > 0 ? formatPrice(currentPrice) : "—"}
          </p>
          {liveTick && (
            <p
              className={cn(
                "text-xs font-bold font-mono mt-0.5",
                priceChange >= 0 ? "text-green-trade" : "text-red-trade",
              )}
            >
              {formatPercent(priceChange)}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-5">
        <div className="pill-tabs">
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              className={cn("pill-tab capitalize text-xs", orderType === t && "pill-tab-active")}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={cn(
              "py-3 flex items-center justify-center gap-2 rounded-xl font-bold border transition-all text-sm",
              side === "buy"
                ? "bg-green-trade/15 border-green-trade/40 text-green-trade shadow-[0_0_24px_rgba(16,185,129,0.15)]"
                : "border-white/[0.06] text-text-muted hover:bg-white/[0.03]",
            )}
          >
            <ArrowUpCircle size={18} /> BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={cn(
              "py-3 flex items-center justify-center gap-2 rounded-xl font-bold border transition-all text-sm",
              side === "sell"
                ? "bg-red-trade/15 border-red-trade/40 text-red-trade shadow-[0_0_24px_rgba(239,68,68,0.15)]"
                : "border-white/[0.06] text-text-muted hover:bg-white/[0.03]",
            )}
          >
            <ArrowDownCircle size={18} /> SELL
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 flex-1">
          {orderType === "limit" && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Limit Price (USDT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                  className="input-field pr-12 font-mono"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-xs text-text-muted font-medium">USDT</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Quantity ({symbolBase(symbol)})
            </label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field pr-14 font-mono"
                step="0.001"
                min="0"
              />
              <span className="absolute right-3 top-2.5 text-xs text-text-muted font-medium">
                {symbolBase(symbol)}
              </span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[["25%", 0.25], ["50%", 0.5], ["75%", 0.75], ["Max", 1]].map(([label, pct]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => setQuantityPct(pct as number)}
                  className="flex-1 py-1.5 text-[10px] font-bold bg-black/30 hover:bg-brand/15 hover:text-brand text-text-muted rounded-lg border border-white/[0.05] transition-colors"
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-auto pt-5 border-t border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-white/[0.05]">
            <span className="text-sm text-text-muted font-medium">Est. Total</span>
            <span className="font-mono font-bold text-text-primary tabular-nums">
              ~ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-brand/8 rounded-xl text-brand text-xs border border-brand/15">
            <Info size={15} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">Risk Engine: Max position 2% · Auto Stop Loss 1.5% · Live WebSocket feed</p>
          </div>

          <button
            onClick={handleTrade}
            disabled={loading}
            className={`${side === "buy" ? "btn-buy" : "btn-sell"} flex items-center justify-center gap-2 disabled:opacity-60`}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Validating risk...</>
            ) : (
              <>{side === "buy" ? "Execute Buy" : "Execute Sell"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
