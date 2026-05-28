"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, Candle, getToken } from "@/lib/api";

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
          background: { type: ColorType.Solid, color: "#131c35" },
          textColor: "#94a3b8",
          fontFamily: "Inter, system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: "#1e2d4a" },
          horzLines: { color: "#1e2d4a" },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: {
          borderColor: "#1e2d4a",
          scaleMargins: { top: 0.08, bottom: 0.22 },
        },
        timeScale: {
          borderColor: "#1e2d4a",
          timeVisible: true,
          secondsVisible: timeframe === "1m" || timeframe === "5m",
        },
      });
      chartInst.current = chart;

      const series = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
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
          color: c.close >= c.open ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)",
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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-bg-card/90 backdrop-blur-sm">
          <Loader2 size={24} className="animate-spin text-brand" />
        </div>
      )}
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
