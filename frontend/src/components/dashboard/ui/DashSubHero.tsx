"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface DashSubHeroStat {
  label: string;
  value: string;
}

interface DashSubHeroProps {
  badge: string;
  title: ReactNode;
  description: string;
  stats?: DashSubHeroStat[];
  actions?: ReactNode;
}

export function DashSubHero({ badge, title, description, stats, actions }: DashSubHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="dash-subpage-hero"
    >
      <div className="dash-subpage-hero-main">
        <span className="dash-live-badge">
          <span className="dash-live-dot" />
          {badge}
        </span>
        <h1 className="dash-subpage-hero-title">{title}</h1>
        <p className="dash-subheading">{description}</p>
        {stats && stats.length > 0 && (
          <div className="dash-hero-stats-row">
            {stats.map((s) => (
              <div key={s.label} className="dash-hero-stat-pill">
                <span className="dash-label">{s.label}</span>
                <p className="dash-hero-stat-value">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="dash-subpage-hero-actions">{actions}</div>}
    </motion.section>
  );
}
