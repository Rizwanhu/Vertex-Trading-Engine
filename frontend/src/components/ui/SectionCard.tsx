import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  glow?: boolean;
}

export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  noPadding,
  glow,
}: SectionCardProps) {
  return (
    <div className={cn(glow ? "glass-panel-glow" : "glass-panel", "flex flex-col overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.06] shrink-0 bg-gradient-to-r from-white/[0.03] to-transparent">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <Icon size={16} strokeWidth={2.5} />
            </div>
          )}
          <h3 className="section-title">{title}</h3>
        </div>
        {action}
      </div>
      <div className={cn(!noPadding && "p-4 sm:p-5", "flex-1 min-h-0")}>{children}</div>
    </div>
  );
}
