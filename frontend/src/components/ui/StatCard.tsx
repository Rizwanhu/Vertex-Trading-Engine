"use client";
import { cn } from "@/lib/utils";
import { Loader2, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  highlight?: boolean;
  delay?: number;
}

export function StatCard({
  title,
  value,
  sub,
  trend = "neutral",
  icon: Icon,
  loading,
  className,
  highlight,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "stat-card",
        highlight && "border-brand/30 ring-1 ring-brand/10",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-xl border transition-colors",
              highlight
                ? "bg-brand/15 border-brand/25 text-brand"
                : "bg-bg-secondary border-bg-border text-text-muted group-hover:text-brand group-hover:border-brand/30",
            )}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="relative mt-1">
        {loading ? (
          <Loader2 size={22} className="animate-spin text-brand mt-2" />
        ) : (
          <>
            <p
              className={cn(
                "font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums",
                trend === "up" && "text-green-trade",
                trend === "down" && "text-red-trade",
                trend === "neutral" && "text-text-primary",
              )}
            >
              {value}
            </p>
            {sub && (
              <p
                className={cn(
                  "text-xs mt-1.5 font-medium",
                  trend === "up" && "text-green-trade/80",
                  trend === "down" && "text-red-trade/80",
                  trend === "neutral" && "text-text-muted",
                )}
              >
                {sub}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
