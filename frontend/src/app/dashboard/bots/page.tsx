"use client";
import { Play, Square, Pause, Settings, Activity } from "lucide-react";

const MOCK_BOTS = [
  { id: 1, name: "BTC RSI Scalper", symbol: "BTCUSDT", strategy: "RSI", status: "running", pnl: +124.50, trades: 14 },
  { id: 2, name: "ETH Trend Follower", symbol: "ETHUSDT", strategy: "MA Crossover", status: "paused", pnl: -12.30, trades: 3 },
  { id: 3, name: "SOL ML Predictor", symbol: "SOLUSDT", strategy: "XGBoost Hybrid", status: "idle", pnl: 0, trades: 0 },
];

export default function BotsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Algo Bots</h1>
          <p className="text-text-secondary text-sm mt-1">Manage and monitor your automated trading bots.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <span>+ Create Bot</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_BOTS.map((bot) => (
          <div key={bot.id} className="card p-5 flex flex-col hover:border-brand/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-text-primary">{bot.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded text-text-secondary">{bot.symbol}</span>
                  <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded">{bot.strategy}</span>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                bot.status === 'running' ? 'bg-green-trade animate-pulse-slow' :
                bot.status === 'paused' ? 'bg-yellow-400' : 'bg-text-muted'
              }`} />
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-bg-border mb-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Total P&L</p>
                <p className={`text-lg font-mono font-bold ${bot.pnl >= 0 ? 'text-green-trade' : 'text-red-trade'}`}>
                  {bot.pnl >= 0 ? '+' : ''}${bot.pnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Total Trades</p>
                <p className="text-lg font-mono font-bold text-text-primary">{bot.trades}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              {bot.status !== 'running' ? (
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-trade/10 text-green-trade hover:bg-green-trade/20 transition-colors text-sm font-medium">
                  <Play size={16} /> Start
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors text-sm font-medium">
                  <Pause size={16} /> Pause
                </button>
              )}
              <button className="p-2 rounded-lg bg-red-trade/10 text-red-trade hover:bg-red-trade/20 transition-colors">
                <Square size={16} />
              </button>
              <button className="p-2 rounded-lg bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors ml-auto">
                <Settings size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
