"use client";
import { Wallet, PieChart as PieChartIcon, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockEquityData = Array.from({ length: 30 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  equity: 10000 + Math.random() * 2000 + i * 100,
}));

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
        <p className="text-text-secondary text-sm mt-1">Track your assets, P&L, and equity curve.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-card border-brand/20">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <Wallet size={20} className="text-brand" />
            <h3 className="font-medium">Estimated Balance</h3>
          </div>
          <p className="text-4xl font-mono font-bold text-white mb-2">$12,450.00</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-trade bg-green-trade/10 px-2 py-0.5 rounded font-medium">+ $320.50</span>
            <span className="text-text-muted">Today</span>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <Activity size={20} />
            <h3 className="font-medium">Total P&L</h3>
          </div>
          <p className="text-3xl font-mono font-bold text-green-trade mb-2">+$2,450.00</p>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>All Time Return: <span className="text-text-primary font-medium">24.5%</span></span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4 text-text-secondary">
            <PieChartIcon size={20} />
            <h3 className="font-medium">Asset Allocation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-brand" /> USDT</span>
              <span className="text-sm font-mono text-text-primary">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#f7931a]" /> BTC</span>
              <span className="text-sm font-mono text-text-primary">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#627eea]" /> ETH</span>
              <span className="text-sm font-mono text-text-primary">10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="card flex flex-col h-[400px]">
        <div className="p-4 border-b border-bg-border shrink-0 flex items-center gap-2">
          <TrendingUp size={18} className="text-brand" />
          <h3 className="font-semibold text-text-primary">Equity Curve (30 Days)</h3>
        </div>
        <div className="p-4 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockEquityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#131c35', border: '1px solid #1e2d4a', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
              />
              <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
