"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DashSegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  columns?: number;
}

export function DashSegmented<T extends string>({
  options,
  value,
  onChange,
  className,
  columns,
}: DashSegmentedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState({ width: 0, x: 0 });
  const activeIndex = options.findIndex((o) => o.value === value);
  const cols = columns ?? options.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const btn = el.querySelectorAll<HTMLButtonElement>(".dash-segmented-btn")[activeIndex];
    if (!btn) return;
    setSlider({ width: btn.offsetWidth, x: btn.offsetLeft - el.offsetLeft });
  }, [value, activeIndex, options.length]);

  return (
    <div
      ref={containerRef}
      className={cn("dash-segmented", className)}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      <div
        className="dash-segmented-slider"
        style={{
          width: slider.width ? `${slider.width}px` : `calc(${100 / cols}% - 4px)`,
          transform: `translateX(${slider.x}px)`,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "dash-segmented-btn",
            value === opt.value && "dash-segmented-active",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
