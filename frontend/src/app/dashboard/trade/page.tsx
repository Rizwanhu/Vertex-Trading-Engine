import { TradingChart } from "@/components/charts/TradingChart";
import { TradePanel } from "@/components/dashboard/TradePanel";
import { OrdersTable } from "@/components/dashboard/OrdersTable";

export default function TradePage() {
  return (
    <div className="flex flex-col gap-6 h-full min-h-[800px]">
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Full Chart */}
        <div className="flex-1 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-bg-border flex items-center justify-between bg-bg-elevated shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-text-primary">BTC/USDT</h2>
              <span className="text-lg font-mono text-green-trade">$67,420.50</span>
              <span className="text-sm font-medium text-green-trade bg-green-trade/10 px-2 py-0.5 rounded">+2.34%</span>
            </div>
            <div className="flex items-center gap-2">
              {["1m", "5m", "15m", "1h", "4h", "1d", "1w"].map((tf) => (
                <button
                  key={tf}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    tf === "1h" ? "bg-brand text-white shadow-glow" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-bg-card">
            <TradingChart symbol="BTCUSDT" />
          </div>
        </div>

        {/* Trade Panel */}
        <div className="w-full lg:w-80 shrink-0">
          <TradePanel symbol="BTCUSDT" currentPrice={67420.5} />
        </div>
      </div>

      {/* Orders */}
      <div className="card h-80 flex flex-col">
        <div className="p-4 border-b border-bg-border bg-bg-elevated flex gap-6 shrink-0">
          <button className="text-brand font-semibold border-b-2 border-brand pb-4 -mb-4">Open Orders</button>
          <button className="text-text-muted hover:text-text-secondary font-semibold pb-4 -mb-4 transition-colors">Order History</button>
          <button className="text-text-muted hover:text-text-secondary font-semibold pb-4 -mb-4 transition-colors">Trade History</button>
        </div>
        <div className="p-0 flex-1 overflow-auto">
          <OrdersTable />
        </div>
      </div>
    </div>
  );
}
