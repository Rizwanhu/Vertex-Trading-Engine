import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface DashSectionProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  flush?: boolean;
}

export function DashSection({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  glow,
  flush,
}: DashSectionProps) {
  return (
    <section className={cn("dash-card", glow && "dash-card-glow", className)}>
      <div className="dash-section-head">
        <div>
          <h2 className="dash-section-title">
            {Icon && (
              <span className="dash-section-icon">
                <Icon size={16} strokeWidth={2.5} />
              </span>
            )}
            {title}
          </h2>
          {subtitle && <p className="dash-section-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={cn(flush ? "dash-body-flush" : "dash-body")}>{children}</div>
    </section>
  );
}
