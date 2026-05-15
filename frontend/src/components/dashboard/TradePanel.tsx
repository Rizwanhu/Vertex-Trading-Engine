"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, Info, Loader2 } from "lucide-react";
import { api, getToken } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";

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
    <div className="card-elevated flex flex-col h-full">
      <div className="p-4 border-b border-bg-border flex items-center justify-between">
        <h3 className="font-bold text-text-primary">Place Order</h3>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold text-text-primary">
            {currentPrice > 0 ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
          </p>
          {liveTick && (
            <p className={`text-xs font-mono ${priceChange >= 0 ? "text-green-trade" : "text-red-trade"}`}>
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-5">
        {/* Order type */}
        <div className="flex bg-bg-secondary p-1 rounded-lg">
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                orderType === t
                  ? "bg-bg-elevated text-text-primary shadow"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Side selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSide("buy")}
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold border transition-all ${
              side === "buy"
                ? "bg-green-trade/20 border-green-trade text-green-trade"
                : "border-bg-border text-text-muted hover:bg-bg-secondary"
            }`}
          >
            <ArrowUpCircle size={18} /> BUY
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded-lg font-bold border transition-all ${
              side === "sell"
                ? "bg-red-trade/20 border-red-trade text-red-trade"
                : "border-bg-border text-text-muted hover:bg-bg-secondary"
            }`}
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
              Quantity ({symbol.replace("USDT", "")})
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
                {symbol.replace("USDT", "")}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {[["25%", 0.25], ["50%", 0.5], ["75%", 0.75], ["Max", 1]] .map(([label, pct]) => (
                <button
                  key={label as string}
                  onClick={() => setQuantityPct(pct as number)}
                  className="flex-1 py-1 text-[10px] font-medium bg-bg-secondary hover:bg-bg-elevated text-text-secondary rounded transition-colors"
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-auto pt-4 border-t border-bg-border space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Est. Total</span>
            <span className="font-mono text-text-primary">
              ~ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-brand/10 rounded-lg text-brand text-xs border border-brand/20">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>Risk Engine: Max position 2% • Auto Stop Loss 1.5% • Live price via WebSocket</p>
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
