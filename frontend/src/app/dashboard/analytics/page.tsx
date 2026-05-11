import { BarChart3, TrendingUp, Target, Activity, CheckCircle2, XCircle } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Deep dive into your trading performance and strategy metrics.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary"><Target size={16}/> <span className="text-sm font-medium">Win Rate</span></div>
          <p className="text-2xl font-bold text-text-primary">68.5%</p>
          <div className="w-full bg-bg-secondary h-1.5 rounded-full mt-1 overflow-hidden">
            <div className="bg-brand h-full rounded-full" style={{ width: '68.5%' }} />
          </div>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary"><TrendingUp size={16}/> <span className="text-sm font-medium">Sharpe Ratio</span></div>
          <p className="text-2xl font-bold text-brand">1.85</p>
          <p className="text-xs text-green-trade">Excellent</p>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary"><Activity size={16}/> <span className="text-sm font-medium">Max Drawdown</span></div>
          <p className="text-2xl font-bold text-text-primary">12.4%</p>
          <p className="text-xs text-text-muted">Last 30 Days</p>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-text-secondary"><BarChart3 size={16}/> <span className="text-sm font-medium">Total Trades</span></div>
          <p className="text-2xl font-bold text-text-primary">1,245</p>
          <p className="text-xs flex gap-3 mt-1">
             <span className="flex items-center gap-1 text-green-trade"><CheckCircle2 size={12}/> 853</span>
             <span className="flex items-center gap-1 text-red-trade"><XCircle size={12}/> 392</span>
          </p>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 h-80 flex items-center justify-center">
          <p className="text-text-muted">Strategy Performance Chart coming soon...</p>
        </div>
        <div className="card p-5 h-80 flex items-center justify-center">
          <p className="text-text-muted">Monthly P&L Heatmap coming soon...</p>
        </div>
      </div>
    </div>
  );
}
