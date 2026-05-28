"use client";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BotPanel } from "@/components/dashboard/BotPanel";
import { DashStatCard } from "@/components/dashboard/ui/DashStatCard";
import { Bot, Cpu, Clock, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { Bot as BotType } from "@/lib/api";

const FEATURES = [
  { icon: Bot, title: "Rule-based", desc: "RSI & MA crossover presets with clear entry rules" },
  { icon: Cpu, title: "Risk-aware", desc: "Position caps, stop-loss, and daily loss limits" },
  { icon: Clock, title: "Scheduled", desc: "Celery-driven ticks on your chosen timeframe" },
];

export default function BotsPage() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = useCallback(async () => {
    try {
      setBots(await api.bots.list());
    } catch {
      /* AuthGuard */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const running = bots.filter((b) => b.status === "running").length;
  const stopped = bots.filter((b) => b.status === "stopped" || b.status === "idle").length;

  return (
    <div className="dash-bots-page">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="dash-bots-section dash-bots-hero"
      >
        <div className="dash-bots-hero-main">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="dash-live-badge">
              <span className="dash-live-dot" />
              Automation
            </span>
          </div>
          <h1 className="dash-bots-hero-title">
            Algo <span>Bots</span>
          </h1>
          <p className="dash-subheading">
            Deploy RSI and MA crossover strategies. Each bot runs on a Celery schedule with built-in
            risk controls on Binance.
          </p>
          <div className="dash-hero-stats-row">
            {[
              { label: "Strategies", value: "RSI · MA" },
              { label: "Scheduler", value: "Celery" },
              { label: "Broker", value: "Binance" },
            ].map((s) => (
              <div key={s.label} className="dash-hero-stat-pill">
                <span className="dash-label">{s.label}</span>
                <p className="dash-hero-stat-value">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-bots-hero-actions">
          <a href="#bots-panel" className="dash-btn-primary">
            <Zap size={16} /> Manage bots
          </a>
        </div>
      </motion.section>

      <section className="dash-bots-section dash-bots-section--stats">
        <div className="dash-stat-grid">
          <DashStatCard
            title="Total bots"
            value={loading ? "…" : String(bots.length)}
            sub="Configured strategies"
            trend="neutral"
            icon={Bot}
            loading={loading}
            highlight
            index={0}
          />
          <DashStatCard
            title="Running"
            value={loading ? "…" : String(running)}
            sub="Active on schedule"
            trend={running > 0 ? "up" : "neutral"}
            icon={Zap}
            loading={loading}
            index={1}
          />
          <DashStatCard
            title="Stopped"
            value={loading ? "…" : String(stopped)}
            sub="Idle or paused"
            trend="neutral"
            icon={Clock}
            loading={loading}
            index={2}
          />
          <DashStatCard
            title="Engine"
            value="Celery"
            sub="Background worker"
            trend="neutral"
            icon={Cpu}
            loading={false}
            index={3}
          />
        </div>
      </section>

      <section className="dash-bots-section dash-bots-section--features">
        <div className="dash-feature-grid">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.35 }}
              className="dash-feature-card"
            >
              <div className="dash-feature-icon">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="dash-feature-title">{title}</p>
                <p className="dash-feature-desc">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="bots-panel"
        className="dash-bots-section dash-bots-section--panel dash-card dash-card-glow dash-bots-panel-card min-h-[520px] flex flex-col overflow-hidden"
      >
        <BotPanel onBotsChange={setBots} />
      </section>
    </div>
  );
}
