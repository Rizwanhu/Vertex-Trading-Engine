"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TradingChart } from "@/components/charts/TradingChart";
import { ChartHeader } from "@/components/charts/ChartHeader";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { DashSubHero } from "@/components/dashboard/ui/DashSubHero";
import { DashSection } from "@/components/dashboard/ui/DashSection";
import { SymbolSelect } from "@/components/ui/SymbolSelect";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatPrice, formatPercent, symbolLabel } from "@/lib/format";
import { CandlestickChart, Layers } from "lucide-react";

export default function TradePage() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const tick = useSymbolPrice(symbol);
  const price = tick ? parseFloat(tick.price) : 0;
  const change = tick ? parseFloat(tick.change) : 0;

  return (
    <div className="dash-subpage dash-trade-page">
      <DashSubHero
        badge="Execution"
        title={
          <>
            <span>Trade</span> desk
          </>
        }
        description="Professional charting workspace with instant order entry and live WebSocket pricing."
        stats={[
          { label: "Pair", value: symbolLabel(symbol) },
          { label: "Price", value: price > 0 ? formatPrice(price) : "—" },
          { label: "24h", value: tick ? formatPercent(change) : "—" },
        ]}
      />

      <section className="dash-subpage-section">
        <div className="dash-symbol-bar">
          <SymbolSelect value={symbol} onChange={setSymbol} variant="pills" />
          <span className="dash-live-badge">
            <span className="dash-live-dot" />
            Live feed
          </span>
        </div>
      </section>

      <section className="dash-subpage-section dash-trade-layout">
        <div className="dash-chart-stage">
          <DashSection
            title="Live chart"
            subtitle={`${symbol.replace("USDT", "/USDT")} · ${timeframe}`}
            icon={CandlestickChart}
            glow
            flush
            className="h-full flex flex-col"
            action={
              <span className="dash-live-badge">
                <span className="dash-live-dot" />
                Real-time
              </span>
            }
          >
            <ChartHeader
              symbol={symbol}
              tick={tick}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              timeframes={["1m", "5m", "15m", "1h", "4h", "1d", "1w"]}
            />
            <div className="dash-chart-wrap">
              <div className="dash-chart-glow" aria-hidden />
              <TradingChart symbol={symbol} timeframe={timeframe} />
            </div>
          </DashSection>
        </div>

        <div className="dash-trade-sidebar">
          <TradePanel symbol={symbol} broker="binance" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="dash-session-card dash-card"
          >
            <div className="dash-section-head dash-section-head--compact">
              <h3 className="dash-section-title">
                <span className="dash-section-icon">
                  <Layers size={16} strokeWidth={2.5} />
                </span>
                Session info
              </h3>
            </div>
            <dl className="dash-session-list">
              <div className="dash-session-row">
                <dt>Broker</dt>
                <dd>Binance</dd>
              </div>
              <div className="dash-session-row">
                <dt>Timeframe</dt>
                <dd className="dash-session-mono">{timeframe}</dd>
              </div>
              <div className="dash-session-row">
                <dt>Feed</dt>
                <dd className="dash-session-live">
                  <span className="dash-live-dot" />
                  WebSocket
                </dd>
              </div>
            </dl>
          </motion.div>
        </div>
      </section>

      <section className="dash-subpage-section">
        <DashSection title="Order history" subtitle="Open positions & fills" glow flush className="dash-orders-panel">
          <OrdersTable />
        </DashSection>
      </section>
    </div>
  );
}
