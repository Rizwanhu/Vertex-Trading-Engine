import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  noPadding?: boolean;
}

export function GlassCard({ children, className, header, noPadding }: GlassCardProps) {
  return (
    <div className={cn("glass-panel flex flex-col", className)}>
      {header && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.06] shrink-0">{header}</div>
      )}
      <div className={cn(!noPadding && "p-4 sm:p-5", "flex-1 min-h-0")}>{children}</div>
    </div>
  );
}
