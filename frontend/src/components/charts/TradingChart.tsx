"use client";
import { useEffect, useRef } from "react";

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
  data?: CandleData[];
}

// Generate mock OHLCV data for demo
function generateMockCandles(count = 150): CandleData[] {
  const candles: CandleData[] = [];
  let price = 67000;
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600; // 1h

  for (let i = count - 1; i >= 0; i--) {
    const open = price;
    const changePercent = (Math.random() - 0.48) * 0.03;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low  = Math.min(open, close) * (1 - Math.random() * 0.01);
    candles.push({
      time: now - i * interval,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low:  +low.toFixed(2),
      close: +close.toFixed(2),
      volume: +(Math.random() * 1000 + 100).toFixed(2),
    });
    price = close;
  }
  return candles;
}

export function TradingChart({ symbol = "BTCUSDT", data }: TradingChartProps) {
  const chartRef  = useRef<HTMLDivElement>(null);
  const chartInst = useRef<any>(null);

  useEffect(() => {
    let chart: any, series: any, volumeSeries: any;

    async function initChart() {
      if (!chartRef.current) return;
      const { createChart, ColorType, CrosshairMode } = await import("lightweight-charts");

      chart = createChart(chartRef.current, {
        width:  chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: "#131c35" },
          textColor:  "#94a3b8",
        },
        grid: {
          vertLines:  { color: "#1e2d4a" },
          horzLines:  { color: "#1e2d4a" },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: "#1e2d4a", scaleMargins: { top: 0.1, bottom: 0.25 } },
        timeScale: { borderColor: "#1e2d4a", timeVisible: true, secondsVisible: false },
      });
      chartInst.current = chart;

      series = chart.addCandlestickSeries({
        upColor:        "#10b981",
        downColor:      "#ef4444",
        borderUpColor:  "#10b981",
        borderDownColor:"#ef4444",
        wickUpColor:    "#10b981",
        wickDownColor:  "#ef4444",
      });

      volumeSeries = chart.addHistogramSeries({
        priceFormat:    { type: "volume" },
        priceScaleId:   "",
        color:          "#3b82f6",
        scaleMargins:   { top: 0.8, bottom: 0 },
      });

      const candles = data || generateMockCandles();
      series.setData(candles);
      volumeSeries.setData(candles.map((c) => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
      })));

      chart.timeScale().fitContent();
    }

    initChart();

    const handleResize = () => {
      if (chartRef.current && chartInst.current) {
        chartInst.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart?.remove();
    };
  }, [data, symbol]);

  return (
    <div className="relative w-full h-full tv-chart-container">
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}
