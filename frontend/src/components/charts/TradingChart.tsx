"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, Candle, getToken } from "@/lib/api";
import type { ChartMarketStats } from "@/components/charts/ChartHeader";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  symbol?: string;
  timeframe?: string;
  data?: CandleData[];
  className?: string;
  onMarketStats?: (stats: ChartMarketStats) => void;
}

function computeMarketStats(candles: CandleData[]): ChartMarketStats {
  if (candles.length === 0) return { high: 0, low: 0, volume: 0 };
  let high = -Infinity;
  let low = Infinity;
  let volume = 0;
  for (const c of candles) {
    high = Math.max(high, c.high);
    low = Math.min(low, c.low);
    volume += c.volume;
  }
  return { high, low, volume };
}

function generateMockCandles(count = 150): CandleData[] {
  const candles: CandleData[] = [];
  let price = 67000;
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600;

  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const changePercent = (Math.random() - 0.48) * 0.03;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    candles.push({
      time: now - i * interval,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: +(Math.random() * 1000 + 100).toFixed(2),
    });
    price = close;
  }
  return candles;
}

function normalizeCandles(raw: Candle[]): CandleData[] {
  return raw.map((c) => ({
    time:
      typeof c.time === "number"
        ? c.time
        : Math.floor(new Date(c.time as unknown as string).getTime() / 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
}

export function TradingChart({
  symbol = "BTCUSDT",
  timeframe = "1h",
  data,
  className,
  onMarketStats,
}: TradingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInst = useRef<ReturnType<
    typeof import("lightweight-charts")["createChart"]
  > | null>(null);
  const [candles, setCandles] = useState<CandleData[]>(data ?? []);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) {
      setCandles(data);
      setLoading(false);
      return;
    }
    if (!getToken()) {
      setCandles(generateMockCandles());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.market.candles(symbol, timeframe, 200);
        if (!cancelled) setCandles(normalizeCandles(res.candles));
      } catch {
        if (!cancelled) setCandles(generateMockCandles());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, data]);

  useEffect(() => {
    if (candles.length > 0 && onMarketStats) {
      onMarketStats(computeMarketStats(candles));
    }
  }, [candles, onMarketStats]);

  useEffect(() => {
    let chart: ReturnType<typeof import("lightweight-charts")["createChart"]> | undefined;

    async function initChart() {
      if (!chartRef.current || candles.length === 0) return;
      const { createChart, ColorType, CrosshairMode } = await import("lightweight-charts");

      if (chartInst.current) {
        chartInst.current.remove();
        chartInst.current = null;
      }

      const height = chartRef.current.clientHeight || 400;
      const width = chartRef.current.clientWidth;

      chart = createChart(chartRef.current, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: "#0b0e11" },
          textColor: "#5c6678",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.04)" },
          horzLines: { color: "rgba(255, 255, 255, 0.04)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "rgba(0, 255, 163, 0.35)", width: 1, style: 2 },
          horzLine: { color: "rgba(0, 255, 163, 0.35)", width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: "rgba(36, 48, 73, 0.5)",
          scaleMargins: { top: 0.1, bottom: 0.2 },
        },
        timeScale: {
          borderColor: "rgba(36, 48, 73, 0.5)",
          timeVisible: true,
          secondsVisible: timeframe === "1m" || timeframe === "5m",
        },
      });
      chartInst.current = chart;

      const series = chart.addCandlestickSeries({
        upColor: "#00ffa3",
        downColor: "#f87171",
        borderUpColor: "#33ffb5",
        borderDownColor: "#fca5a5",
        wickUpColor: "#33ffb5",
        wickDownColor: "#fca5a5",
      });

      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      series.setData(
        candles.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
      volumeSeries.setData(
        candles.map((c) => ({
          time: c.time as import("lightweight-charts").UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(0,255,163,0.22)" : "rgba(248,113,113,0.22)",
        })),
      );

      chart.timeScale().fitContent();
    }

    initChart();

    const ro = new ResizeObserver(() => {
      if (chartRef.current && chartInst.current) {
        chartInst.current.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight || 400,
        });
      }
    });
    if (chartRef.current) ro.observe(chartRef.current);

    return () => {
      ro.disconnect();
      chart?.remove();
      chartInst.current = null;
    };
  }, [candles, timeframe]);

  return (
    <div className={`relative w-full h-full min-h-[280px] tv-chart-container ${className ?? ""}`}>
      <div className="chart-glow absolute inset-0 pointer-events-none z-0" aria-hidden />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0b0e11]/90 backdrop-blur-sm">
          <Loader2 size={24} className="animate-spin text-brand" />
        </div>
      )}
      <div ref={chartRef} className="absolute inset-0 w-full h-full z-[1]" />
    </div>
  );
}
