"use client";
import { useEffect, useState, useCallback } from "react";
import { TradingChart } from "@/components/charts/TradingChart";
import { ChartHeader } from "@/components/charts/ChartHeader";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { PortfolioPanel } from "@/components/dashboard/PortfolioPanel";
import { MarketStrip } from "@/components/dashboard/MarketStrip";
import { StatCard } from "@/components/ui/StatCard";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { Activity, Wallet, Bot, TrendingUp, Sparkles, ArrowUpRight, Zap } from "lucide-react";
import { api, Balance, PnL, Bot as BotType } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";
import { formatCurrency, formatSignedCurrency, formatPercent } from "@/lib/format";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardOverview() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [bots, setBots] = useState<BotType[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");

  const tick = useSymbolPrice(symbol);

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
    <div className="page-container">
      <HeroBanner
        badge="Live Dashboard"
        title={
          <>
            Trading <span className="text-gradient">Command Center</span>
          </>
        }
        description="Monitor markets, execute trades, and supervise automated strategies from one unified workspace."
        stats={[
          { label: "Balance", value: statsLoading ? "…" : formatCurrency(balance?.total_balance) },
          { label: "Today", value: statsLoading ? "…" : formatSignedCurrency(pnl?.today_pnl) },
          { label: "Bots Live", value: statsLoading ? "…" : `${runningBots}/${bots.length}` },
        ]}
        actions={
          <>
            <Link href="/dashboard/trade" className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
              <Zap size={16} /> Quick Trade
            </Link>
            <Link href="/dashboard/bots" className="btn-ghost text-sm py-2.5 inline-flex items-center gap-2">
              Manage Bots <ArrowUpRight size={16} />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Balance" value={formatCurrency(balance?.total_balance)} sub={balance ? `${formatCurrency(balance.in_positions)} deployed` : undefined} trend="neutral" icon={Wallet} loading={statsLoading} highlight delay={0} />
        <StatCard title="Today's P&L" value={formatSignedCurrency(pnl?.today_pnl)} sub={pnl ? formatPercent(pnl.today_pnl_pct) : undefined} trend={(pnl?.today_pnl ?? 0) >= 0 ? "up" : "down"} icon={Activity} loading={statsLoading} delay={50} />
        <StatCard title="Active Bots" value={statsLoading ? "…" : String(runningBots)} sub={`${bots.length} configured`} trend={runningBots > 0 ? "up" : "neutral"} icon={Bot} loading={statsLoading} delay={100} />
        <StatCard title="Win Rate" value={pnl ? `${pnl.win_rate}%` : "—"} sub={pnl ? `${pnl.winning_trades}W / ${pnl.total_trades} trades` : undefined} trend={(pnl?.win_rate ?? 0) >= 50 ? "up" : "down"} icon={TrendingUp} loading={statsLoading} delay={150} />
      </div>

      {bots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bots.slice(0, 6).map((b) => (
            <div
              key={b.id}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
                b.status === "running"
                  ? "bg-green-trade/10 text-green-trade border-green-trade/25"
                  : "bg-white/[0.03] text-text-muted border-white/[0.06]",
              )}
            >
              {b.status === "running" && <span className="live-dot" />}
              {b.name}
            </div>
          ))}
        </div>
      )}

      <MarketStrip />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 lg:gap-6">
        <SectionCard
          title="Live Chart"
          noPadding
          glow
          className="min-h-[460px] lg:min-h-[580px]"
          action={
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-black/30 border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-bold text-text-primary focus:outline-none focus:border-brand/40"
            >
              {["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT"].map((s) => (
                <option key={s} value={s}>{s.replace("USDT", "/USDT")}</option>
              ))}
            </select>
          }
        >
          <ChartHeader
            symbol={symbol}
            tick={tick}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            className="border-b border-white/[0.06] !bg-transparent !p-3 sm:!p-4"
          />
          <div className="flex-1 min-h-[340px] relative">
            <TradingChart symbol={symbol} timeframe={timeframe} />
          </div>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <TradePanel symbol={symbol} broker="binance" />
          <SectionCard title="Portfolio Snapshot" className="hidden xl:flex flex-col" glow>
            <div className="flex items-center gap-2 mb-3 -mt-1">
              <Sparkles size={14} className="text-brand" />
            </div>
            <PortfolioPanel compact />
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent Orders" noPadding className="min-h-[320px]">
        <OrdersTable />
      </SectionCard>
    </div>
  );
}
