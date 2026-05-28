"use client";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  badge?: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  stats?: { label: string; value: string }[];
  className?: string;
}

export function HeroBanner({ badge, title, description, actions, stats, className }: HeroBannerProps) {
  return (
    <div className={cn("hero-banner flex flex-col lg:flex-row lg:items-center justify-between gap-6", className)}>
      <div className="relative z-10 min-w-0 flex-1">
        {badge && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] text-brand bg-brand/10 border border-brand/25 mb-3">
            <span className="live-dot" />
            {badge}
          </span>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-text-secondary text-sm sm:text-base mt-2 max-w-xl leading-relaxed">{description}</p>
        )}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/[0.06]">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{s.label}</p>
                <p className="font-display text-lg font-bold text-text-primary mt-0.5 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="relative z-10 flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
