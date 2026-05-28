"use client";
import { cn } from "@/lib/utils";

interface TimeframePillsProps {
  timeframes: string[];
  active: string;
  onChange: (tf: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export function TimeframePills({
  timeframes,
  active,
  onChange,
  size = "sm",
  className,
}: TimeframePillsProps) {
  return (
    <div className={cn("flex items-center gap-0.5 overflow-x-auto scrollbar-none", className)}>
      {timeframes.map((tf) => (
        <button
          key={tf}
          type="button"
          onClick={() => onChange(tf)}
          className={cn(
            "shrink-0 font-medium rounded-md transition-all",
            size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
            active === tf
              ? "bg-brand text-white shadow-glow"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
          )}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
