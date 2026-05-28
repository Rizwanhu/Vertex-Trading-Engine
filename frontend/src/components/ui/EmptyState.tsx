import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <div className="w-14 h-14 rounded-2xl bg-bg-secondary border border-bg-border flex items-center justify-center mb-4">
        <Icon size={28} className="text-text-muted" />
      </div>
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
