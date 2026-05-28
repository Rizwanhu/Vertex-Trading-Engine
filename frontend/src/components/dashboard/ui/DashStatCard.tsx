"use client";
import { motion } from "framer-motion";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashStatCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  loading?: boolean;
  highlight?: boolean;
  index?: number;
}

export function DashStatCard({
  title,
  value,
  sub,
  trend = "neutral",
  icon: Icon,
  loading,
  highlight,
  index = 0,
}: DashStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={cn("dash-stat", highlight && "dash-stat-highlight")}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="dash-label">{title}</span>
        {Icon && (
          <span className="dash-stat-icon">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
      </div>
      {loading ? (
        <Loader2 size={22} className="animate-spin mt-4" style={{ color: "var(--auth-accent)" }} />
      ) : (
        <>
          <p
            className={cn(
              "dash-stat-value",
              trend === "up" && "dash-stat-value-up",
              trend === "down" && "dash-stat-value-down",
            )}
          >
            {value}
          </p>
          {sub && <p className="dash-stat-sub">{sub}</p>}
        </>
      )}
    </motion.div>
  );
}
