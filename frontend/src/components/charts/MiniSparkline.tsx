"use client";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface MiniSparklineProps {
  positive?: boolean;
  points?: number;
  className?: string;
  /** Use login/signup mint accent (#00ffa3) */
  accent?: boolean;
}

/** Decorative trend line for market cards (seeded from direction). */
export function MiniSparkline({ positive = true, points = 24, className, accent }: MiniSparklineProps) {
  const path = useMemo(() => {
    const w = 72;
    const h = 28;
    const vals: number[] = [];
    let v = positive ? 0.35 : 0.65;
    for (let i = 0; i < points; i++) {
      const wave = Math.sin((i / points) * Math.PI * 2.2) * 0.08;
      const drift = positive ? i * 0.018 : -i * 0.018;
      v = Math.max(0.08, Math.min(0.92, v + wave + drift * 0.15));
      vals.push(v);
    }
    const coords = vals.map((y, i) => {
      const x = (i / (points - 1)) * w;
      const py = h - y * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    });
    return coords.join(" ");
  }, [positive, points]);

  const fillPath = `${path} L72,28 L0,28 Z`;
  const stroke = positive
    ? accent
      ? "#00ffa3"
      : "#10b981"
    : "#f87171";
  const fillId = `${accent ? "a" : ""}${positive ? "spark-up" : "spark-down"}`;

  return (
    <svg
      viewBox="0 0 72 28"
      className={cn("w-[72px] h-7 shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
