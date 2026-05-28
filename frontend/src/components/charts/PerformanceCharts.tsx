"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PnL } from "@/lib/api";
import { ChartTooltip } from "./ChartTooltip";

interface PerformanceChartsProps {
  pnl: PnL | null;
}

export function WinLossPie({ pnl }: PerformanceChartsProps) {
  const wins = pnl?.winning_trades ?? 0;
  const losses = pnl ? pnl.total_trades - pnl.winning_trades : 0;
  const data = [
    { name: "Wins", value: wins, color: "#00ffa3" },
    { name: "Losses", value: losses, color: "#f87171" },
  ].filter((d) => d.value > 0);

  if (!pnl || pnl.total_trades === 0) {
    return (
      <div className="dash-chart-empty">
        No trades to chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          content={
            <ChartTooltip formatter={(v) => `${v} trades`} labelFormatter={(l) => l} />
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PnLBarChart({ pnl }: PerformanceChartsProps) {
  const data = [
    {
      name: "Today",
      value: pnl?.today_pnl ?? 0,
      fill: (pnl?.today_pnl ?? 0) >= 0 ? "#00ffa3" : "#f87171",
    },
    {
      name: "Total",
      value: pnl?.total_pnl ?? 0,
      fill: (pnl?.total_pnl ?? 0) >= 0 ? "#00ffa3" : "#f87171",
    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#475569"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#475569"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={44}
        />
        <Tooltip
          content={<ChartTooltip formatter={(v) => `$${v.toFixed(2)}`} />}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
