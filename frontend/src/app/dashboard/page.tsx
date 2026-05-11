"use client";
import { TradingChart } from "@/components/charts/TradingChart";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Bot } from "lucide-react";

function StatCard({ title, value, change, isUp, icon: Icon }: any) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between text-text-secondary mb-2">
        <span className="text-sm font-medium">{title}</span>
        <Icon size={16} />
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        <span
          className={`flex items-center text-xs font-medium mb-1 ${
            isUp ? "text-green-trade" : "text-red-trade"
          }`}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard title="Total Balance" value="$12,450.00" change="+2.4%" isUp={true} icon={Wallet} />
        <StatCard title="Today's P&L" value="+$320.50" change="+1.2%" isUp={true} icon={Activity} />
        <StatCard title="Active Bots" value="3" change="Running" isUp={true} icon={Bot} />
        <StatCard title="Win Rate (30d)" value="68.5%" change="-2.1%" isUp={false} icon={Activity} />
      </div>

      {/* Main Trading Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Chart */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-bg-border flex items-center justify-between bg-bg-elevated shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-text-primary">BTC/USDT</h2>
              <span className="text-sm font-mono text-green-trade">$67,420.50</span>
            </div>
            <div className="flex items-center gap-2">
              {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
                <button
                  key={tf}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    tf === "1h" ? "bg-brand text-white" : "text-text-secondary hover:bg-bg-secondary"
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
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          <TradePanel symbol="BTCUSDT" currentPrice={67420.5} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="card flex-1 min-h-[300px] flex flex-col">
        <div className="p-4 border-b border-bg-border bg-bg-elevated shrink-0">
          <h3 className="font-semibold text-text-primary">Recent Orders</h3>
        </div>
        <div className="p-0 flex-1 overflow-auto">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
}
