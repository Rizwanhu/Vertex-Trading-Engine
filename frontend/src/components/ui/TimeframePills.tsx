"use client";
import { cn } from "@/lib/utils";

interface TimeframePillsProps {
  timeframes: string[];
  active: string;
  onChange: (tf: string) => void;
  size?: "sm" | "md";
  variant?: "pills" | "segmented";
  className?: string;
}

export function TimeframePills({
  timeframes,
  active,
  onChange,
  size = "sm",
  variant = "pills",
  className,
}: TimeframePillsProps) {
  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex p-0.5 rounded-lg bg-black/40 border border-white/[0.06] overflow-x-auto scrollbar-none",
          className,
        )}
      >
        {timeframes.map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => onChange(tf)}
            className={cn(
              "shrink-0 font-semibold uppercase tracking-wide rounded-md transition-all",
              size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
              active === tf
                ? "bg-brand text-white shadow-[0_2px_12px_rgba(59,130,246,0.35)]"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {tf}
          </button>
        ))}
      </div>
    );
  }

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
