import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  badge?: string;
}

export function PageHeader({ title, description, action, className, badge }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4", className)}>
      <div className="min-w-0">
        {badge && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand mb-1.5">{badge}</p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-text-secondary text-sm mt-2 max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
