"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import type { EquityPoint } from "@/lib/api";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp } from "lucide-react";

interface EquityCurveChartProps {
  data: EquityPoint[];
  loading?: boolean;
  height?: number | string;
}

export function EquityCurveChart({ data, loading, height = "100%" }: EquityCurveChartProps) {
  const chartData = data.map((pt) => ({
    label: (() => {
      try {
        return format(new Date(pt.timestamp), "MMM dd");
      } catch {
        return "";
      }
    })(),
    equity: pt.equity,
    full: pt.timestamp,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 size={24} className="animate-spin text-brand" />
      </div>
    );
  }

  if (chartData.length < 2) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No equity data yet"
        description="Place trades to build your equity curve over time."
        className="py-8"
      />
    );
  }

  const minEq = Math.min(...chartData.map((d) => d.equity));
  const maxEq = Math.max(...chartData.map((d) => d.equity));
  const isUp = chartData[chartData.length - 1].equity >= chartData[0].equity;
  const stroke = isUp ? "#10b981" : "#3b82f6";
  const gradId = "equityGradient";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#475569"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#475569"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[minEq * 0.995, maxEq * 1.005]}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          width={48}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
          }
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, fill: stroke, stroke: "#0a0e1a", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
