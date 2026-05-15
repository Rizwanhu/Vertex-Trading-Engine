"use client";
import { useEffect, useState, useCallback } from "react";
import { TradingChart } from "@/components/charts/TradingChart";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Bot, TrendingUp, Loader2 } from "lucide-react";
import { api, Balance, PnL, Bot as BotType } from "@/lib/api";
import { useSymbolPrice } from "@/lib/usePriceFeed";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

function StatCard({ title, value, change, isUp, icon: Icon, loading }: {
  title: string; value: string; change: string; isUp: boolean; icon: React.ElementType; loading?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between text-text-secondary mb-2">
        <span className="text-sm font-medium">{title}</span>
        <Icon size={16} />
      </div>
      <div className="flex items-end gap-3">
        {loading ? (
          <Loader2 size={18} className="animate-spin text-text-muted mb-1" />
        ) : (
          <>
            <span className="text-2xl font-bold text-text-primary">{value}</span>
            <span className={`flex items-center text-xs font-medium mb-1 ${isUp ? "text-green-trade" : "text-red-trade"}`}>
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {change}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pnl, setPnL] = useState<PnL | null>(null);
  const [bots, setBots] = useState<BotType[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTimeframe, setActiveTimeframe] = useState("1h");

  // Live BTC price from WebSocket
  const btcTick = useSymbolPrice("BTCUSDT");
  const btcPrice = btcTick ? parseFloat(btcTick.price) : 0;
  const btcChange = btcTick ? parseFloat(btcTick.change) : 0;

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
      // Not authenticated yet — handled gracefully
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const runningBots = bots.filter(b => b.status === "running").length;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Total Balance"
          value={balance ? `$${balance.total_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$—"}
          change={balance ? `${balance.in_positions.toFixed(0)} in positions` : ""}
          isUp={true}
          icon={Wallet}
          loading={statsLoading}
        />
        <StatCard
          title="Today's P&L"
          value={pnl ? `${pnl.today_pnl >= 0 ? "+" : ""}$${pnl.today_pnl.toFixed(2)}` : "$—"}
          change={pnl ? `${pnl.today_pnl_pct >= 0 ? "+" : ""}${pnl.today_pnl_pct}%` : ""}
          isUp={(pnl?.today_pnl ?? 0) >= 0}
          icon={Activity}
          loading={statsLoading}
        />
        <StatCard
          title="Active Bots"
          value={statsLoading ? "…" : String(runningBots)}
          change={`${bots.length} total`}
          isUp={runningBots > 0}
          icon={Bot}
          loading={statsLoading}
        />
        <StatCard
          title="Win Rate (all time)"
          value={pnl ? `${pnl.win_rate}%` : "—"}
          change={pnl ? `${pnl.winning_trades}/${pnl.total_trades} wins` : ""}
          isUp={(pnl?.win_rate ?? 0) >= 50}
          icon={TrendingUp}
          loading={statsLoading}
        />
      </div>

      {/* Main Trading Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Chart */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-bg-border flex items-center justify-between bg-bg-elevated shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-text-primary">BTC/USDT</h2>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-mono ${btcChange >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                  {btcPrice > 0 ? `$${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "…"}
                </span>
                {btcTick && (
                  <span className={`text-xs ${btcChange >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                    {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeTimeframe === tf
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <TradingChart symbol="BTCUSDT" />
          </div>
        </div>

        {/* Trade Panel */}
        <div className="w-full lg:w-80 shrink-0">
          <TradePanel symbol="BTCUSDT" broker="binance" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card flex-1 min-h-[320px] flex flex-col overflow-hidden">
        <OrdersTable />
      </div>
    </div>
  );
}
