"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TradingChart } from "@/components/charts/TradingChart";
import { ChartHeader, type ChartMarketStats } from "@/components/charts/ChartHeader";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { PortfolioPanel } from "@/components/dashboard/PortfolioPanel";
import { MarketStrip } from "@/components/dashboard/MarketStrip";
import { MarketWatchlist } from "@/components/dashboard/MarketWatchlist";
import { DepthBook } from "@/components/dashboard/DepthBook";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashStatCard } from "@/components/dashboard/ui/DashStatCard";
import { DashSection } from "@/components/dashboard/ui/DashSection";
import { Activity, Wallet, Bot, TrendingUp, CandlestickChart, Layers3 } from "lucide-react";
import { api, Balance, PnL, Bot as BotType } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatCurrency, formatSignedCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [bots, setBots] = useState<BotType[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [marketStats, setMarketStats] = useState<ChartMarketStats | null>(null);

  const tick = useSymbolPrice(symbol);
  const livePrice = tick ? parseFloat(tick.price) : 0;

  const fetchStats = useCallback(async () => {
    try {
      const [b, p, botList] = await Promise.all([
        api.portfolio.balance(),
        api.portfolio.pnl(),
        api.bots.list(),
      ]);
      setBalance(b);
      setPnL(p);
      setBots(botList);
    } catch {
      /* AuthGuard */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const runningBots = bots.filter((b) => b.status === "running").length;

  return (
    <>
      <DashboardHeader
        symbol={symbol}
        tick={tick}
        balance={statsLoading ? "…" : formatCurrency(balance?.total_balance)}
        todayPnl={statsLoading ? "…" : formatSignedCurrency(pnl?.today_pnl)}
        botsLive={statsLoading ? "…" : `${runningBots}/${bots.length}`}
      />

      <div className="dash-stat-grid">
        <DashStatCard
          title="Total balance"
          value={formatCurrency(balance?.total_balance)}
          sub={balance ? `${formatCurrency(balance.in_positions)} deployed` : undefined}
          trend="neutral"
          icon={Wallet}
          loading={statsLoading}
          highlight
          index={0}
        />
        <DashStatCard
          title="Today's P&L"
          value={formatSignedCurrency(pnl?.today_pnl)}
          sub={pnl ? formatPercent(pnl.today_pnl_pct) : undefined}
          trend={(pnl?.today_pnl ?? 0) >= 0 ? "up" : "down"}
          icon={Activity}
          loading={statsLoading}
          index={1}
        />
        <DashStatCard
          title="Active bots"
          value={statsLoading ? "…" : String(runningBots)}
          sub={`${bots.length} configured`}
          trend={runningBots > 0 ? "up" : "neutral"}
          icon={Bot}
          loading={statsLoading}
          index={2}
        />
        <DashStatCard
          title="Win rate"
          value={pnl ? `${pnl.win_rate}%` : "—"}
          sub={pnl ? `${pnl.winning_trades}W / ${pnl.total_trades} trades` : undefined}
          trend={(pnl?.win_rate ?? 0) >= 50 ? "up" : "down"}
          icon={TrendingUp}
          loading={statsLoading}
          index={3}
        />
      </div>

      {bots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          {bots.slice(0, 8).map((b) => (
            <span
              key={b.id}
              className={cn(
                "dash-chip",
                b.status === "running" && "dash-chip-active",
              )}
            >
              {b.status === "running" && <span className="dash-live-dot" />}
              {b.name}
            </span>
          ))}
        </motion.div>
      )}

      <div className="lg:hidden">
        <DashSection title="Markets" subtitle="Tap a pair to switch chart" flush>
          <div className="p-3">
            <MarketStrip activeSymbol={symbol} onSelect={setSymbol} />
          </div>
        </DashSection>
      </div>

      <div className="dash-trade-grid">
        <div className="hidden xl:block">
          <DashSection
            title="Watchlist"
            subtitle="Live WebSocket feed"
            className="h-full min-h-[640px]"
            glow
            flush
          >
            <MarketWatchlist activeSymbol={symbol} onSelect={setSymbol} />
          </DashSection>
        </div>

        <DashSection
          title="Price chart"
          subtitle={`${symbol.replace("USDT", "/USDT")} · ${timeframe}`}
          icon={CandlestickChart}
          glow
          flush
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
            marketStats={marketStats}
            timeframes={["1m", "5m", "15m", "1h", "4h", "1d", "1w"]}
          />
          <div className="dash-chart-wrap">
            <div className="dash-chart-glow" aria-hidden />
            <TradingChart
              symbol={symbol}
              timeframe={timeframe}
              onMarketStats={setMarketStats}
              className="!min-h-[360px] lg:!min-h-[400px]"
            />
          </div>
          <div className="border-t border-[var(--auth-border)]">
            <div className="dash-section-head !py-2.5 !px-4">
              <span className="dash-label">Order book</span>
              <span className="text-[10px] text-[var(--auth-muted)]">Depth preview</span>
            </div>
            <DepthBook price={livePrice} />
          </div>
        </DashSection>

        <div className="flex flex-col gap-4">
          <TradePanel symbol={symbol} broker="binance" />
          <div className="hidden xl:block dash-card dash-card-glow">
            <div className="dash-section-head">
              <h3 className="dash-section-title">
                <span className="dash-section-icon">
                  <Layers3 size={16} strokeWidth={2.5} />
                </span>
                Portfolio
              </h3>
            </div>
            <div className="dash-body !pt-4">
              <PortfolioPanel compact />
            </div>
          </div>
        </div>
      </div>

      <DashSection title="Recent orders" subtitle="Open positions & history" flush>
        <OrdersTable />
      </DashSection>
    </>
  );
}
