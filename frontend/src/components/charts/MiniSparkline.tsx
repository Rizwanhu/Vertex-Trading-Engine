"use client";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface MiniSparklineProps {
  positive?: boolean;
  points?: number;
  className?: string;
  accent?: boolean;
  size?: "sm" | "md";
}

export function MiniSparkline({
  positive = true,
  points = 20,
  className,
  accent,
  size = "md",
}: MiniSparklineProps) {
  const path = useMemo(() => {
    const w = 56;
    const h = 20;
    const vals: number[] = [];
    let v = positive ? 0.4 : 0.6;
    for (let i = 0; i < points; i++) {
      const wave = Math.sin((i / points) * Math.PI * 2) * 0.06;
      const drift = positive ? 0.012 : -0.012;
      v = Math.max(0.12, Math.min(0.88, v + wave + drift));
      vals.push(v);
    }
    const coords = vals.map((y, i) => {
      const x = (i / (points - 1)) * w;
      const py = h - y * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    });
    return { line: coords.join(" "), w, h };
  }, [positive, points]);

  const fillPath = `${path.line} L${path.w},${path.h} L0,${path.h} Z`;
  const stroke = positive ? (accent ? "#00ffa3" : "#10b981") : "#f87171";
  const fillId = `spark-${accent ? "a" : ""}${positive ? "up" : "down"}-${size}`;

  return (
    <svg
      viewBox={`0 0 ${path.w} ${path.h}`}
      className={cn(
        "block w-full h-full",
        size === "sm" ? "max-w-[56px] max-h-[20px]" : "max-w-[72px] max-h-[28px]",
        className,
      )}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${fillId})`} />
      <path
        d={path.line}
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
