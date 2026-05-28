"use client";
import { useState } from "react";
import { TradingChart } from "@/components/charts/TradingChart";
import { ChartHeader } from "@/components/charts/ChartHeader";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { SymbolSelect } from "@/components/ui/SymbolSelect";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatPrice, formatPercent } from "@/lib/format";
import { CandlestickChart, Layers } from "lucide-react";

export default function TradePage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const tick = useSymbolPrice(symbol);
  const price = tick ? parseFloat(tick.price) : 0;
  const change = tick ? parseFloat(tick.change) : 0;

  return (
    <div className="page-container">
      <HeroBanner
        badge="Execution"
        title={
          <>
            <span className="text-gradient">Trade</span> Desk
          </>
        }
        description="Professional charting workspace with instant order entry and live WebSocket pricing."
        stats={[
          { label: "Pair", value: symbol.replace("USDT", "/USDT") },
          { label: "Price", value: price > 0 ? formatPrice(price) : "—" },
          {
            label: "24h",
            value: tick ? formatPercent(change) : "—",
          },
        ]}
      />

      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-black/20 border border-white/[0.05] w-fit">
        <SymbolSelect value={symbol} onChange={setSymbol} variant="pills" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        <SectionCard
          title="Chart"
          icon={CandlestickChart}
          noPadding
          glow
          className="min-h-[520px] lg:min-h-[640px]"
        >
          <ChartHeader
            symbol={symbol}
            tick={tick}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            timeframes={["1m", "5m", "15m", "1h", "4h", "1d", "1w"]}
            className="border-b border-white/[0.06] !bg-transparent"
          />
          <div className="flex-1 min-h-[420px]">
            <TradingChart symbol={symbol} timeframe={timeframe} />
          </div>
        </SectionCard>

        <div className="space-y-4">
          <TradePanel symbol={symbol} broker="binance" />
          <div className="bento-card">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-brand" />
              <span className="section-title">Session Info</span>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <dt className="text-text-muted">Broker</dt>
                <dd className="font-semibold text-text-primary">Binance</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <dt className="text-text-muted">Timeframe</dt>
                <dd className="font-mono font-bold text-brand">{timeframe}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-text-muted">Feed</dt>
                <dd className="flex items-center gap-1.5 text-green-trade font-semibold text-xs">
                  <span className="live-dot" /> WebSocket
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <SectionCard title="Order Book & History" noPadding className="min-h-[340px]">
        <OrdersTable />
      </SectionCard>
    </div>
  );
}
