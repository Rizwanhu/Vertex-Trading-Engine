"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react";

interface TradePanelProps {
  symbol: string;
  currentPrice: number;
}

export function TradePanel({ symbol, currentPrice }: TradePanelProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("0.1");
  const [price, setPrice] = useState(currentPrice.toString());

  const handleTrade = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: "Validating risk...",
        success: `Successfully placed ${side.toUpperCase()} order for ${quantity} ${symbol}`,
        error: "Risk limit exceeded",
      }
    );
  };

  const totalValue = (parseFloat(quantity) || 0) * (orderType === "market" ? currentPrice : (parseFloat(price) || 0));

  return (
    <div className="card-elevated flex flex-col h-full">
      <div className="p-4 border-b border-bg-border">
        <h3 className="font-bold text-text-primary">Place Order</h3>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-5">
        {/* Type selector */}
        <div className="flex bg-bg-secondary p-1 rounded-lg">
          <button
            onClick={() => setOrderType("market")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              orderType === "market" ? "bg-bg-elevated text-text-primary shadow" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType("limit")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              orderType === "limit" ? "bg-bg-elevated text-text-primary shadow" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Limit
          </button>
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

        {/* Form Inputs */}
        <div className="space-y-4 flex-1">
          {orderType === "limit" && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Price (USDT)</label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input-field pr-12 font-mono"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-xs text-text-muted font-medium">USDT</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Quantity ({symbol.replace("USDT", "")})</label>
            <div className="relative">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field pr-12 font-mono"
                step="0.001"
              />
              <span className="absolute right-3 top-2.5 text-xs text-text-muted font-medium">BTC</span>
            </div>
            
            {/* Quick amount % buttons */}
            <div className="flex gap-2 mt-2">
              {["25%", "50%", "75%", "Max"].map((pct) => (
                <button key={pct} className="flex-1 py-1 text-[10px] font-medium bg-bg-secondary hover:bg-bg-elevated text-text-secondary rounded">
                  {pct}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary & Action */}
        <div className="mt-auto pt-4 border-t border-bg-border space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Est. Total</span>
            <span className="font-mono text-text-primary">~ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT</span>
          </div>
          
          <div className="flex items-start gap-2 p-2.5 bg-brand/10 rounded-lg text-brand text-xs border border-brand/20">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>Risk Engine: Max position size is 2%. Order will auto-attach 1.5% Stop Loss.</p>
          </div>

          <button
            onClick={handleTrade}
            className={side === "buy" ? "btn-buy" : "btn-sell"}
          >
            {side === "buy" ? "Execute Buy" : "Execute Sell"}
          </button>
        </div>
      </div>
    </div>
  );
}
