"use client";
import { BotPanel } from "@/components/dashboard/BotPanel";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { Bot, Cpu, Clock } from "lucide-react";

export default function BotsPage() {
  return (
    <div className="page-container h-full min-h-0">
      <HeroBanner
        badge="Automation Engine"
        title={
          <>
            Algo <span className="text-gradient">Bots</span>
          </>
        }
        description="Deploy RSI and MA crossover strategies. Each bot ticks on its Celery schedule with built-in risk controls."
        stats={[
          { label: "Strategies", value: "RSI · MA" },
          { label: "Scheduler", value: "Celery" },
          { label: "Broker", value: "Binance" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { icon: Bot, title: "Rule-based", desc: "RSI & MA crossover presets" },
          { icon: Cpu, title: "Risk-aware", desc: "Position & stop-loss limits" },
          { icon: Clock, title: "Scheduled", desc: "Timeframe-driven ticks" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bento-card flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand shrink-0">
              <Icon size={18} />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">{title}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-[520px] glass-panel-glow p-4 sm:p-5">
        <BotPanel />
      </div>
    </div>
  );
}
