"use client";
import { useState } from "react";
import { Key, Shield, Bell, Database, Settings2 } from "lucide-react";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { SectionCard } from "@/components/ui/SectionCard";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "api", label: "API Keys", icon: Key },
  { id: "risk", label: "Risk", icon: Shield },
  { id: "notify", label: "Alerts", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("api");
  const [telegramOn, setTelegramOn] = useState(true);

  return (
    <div className="page-container max-w-4xl">
      <HeroBanner
        badge="Configuration"
        title={
          <>
            Account <span className="text-gradient">Settings</span>
          </>
        }
        description="Manage broker connections, global risk limits, and notification preferences."
      />

      <div className="pill-tabs max-w-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn("pill-tab flex items-center justify-center gap-2", tab === id && "pill-tab-active")}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "api" && (
        <SectionCard title="Broker API Keys" icon={Key} glow>
          <p className="text-sm text-text-muted mb-5">Connect exchanges for live trading and portfolio sync.</p>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-black/25 border border-white/[0.06] hover:border-brand/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400 font-display font-bold text-xl">
                  B
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Binance</h4>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                    <span className="live-dot" /> Production · Added May 2026
                  </p>
                </div>
              </div>
              <button type="button" className="text-xs font-bold text-red-trade hover:bg-red-trade/10 px-4 py-2 rounded-lg border border-red-trade/20 transition-colors self-start">
                Disconnect
              </button>
            </div>
            <button
              type="button"
              className="w-full py-4 border border-dashed border-white/[0.1] rounded-xl text-text-secondary hover:text-brand hover:border-brand/30 hover:bg-brand/5 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
            >
              + Add New API Key
            </button>
          </div>
        </SectionCard>
      )}

      {tab === "risk" && (
        <SectionCard title="Global Risk Limits" icon={Shield} glow>
          <p className="text-sm text-text-muted mb-6">These limits apply to all manual trades and new bots.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {[
              { label: "Max Position Size (%)", hint: "Maximum % of portfolio per trade", default: "2.0" },
              { label: "Daily Loss Limit (%)", hint: "Halt all trading if exceeded", default: "5.0" },
              { label: "Default Stop Loss (%)", hint: "Applied to new bots automatically", default: "1.5" },
              { label: "Max Open Trades", hint: "Concurrent positions allowed", default: "5" },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="block text-sm font-semibold text-text-primary">{field.label}</label>
                <input type="number" defaultValue={field.default} className="input-field" step="0.1" />
                <p className="text-xs text-text-muted">{field.hint}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" className="btn-primary px-8">Save Risk Settings</button>
          </div>
        </SectionCard>
      )}

      {tab === "notify" && (
        <SectionCard title="Notifications" icon={Bell} glow>
          <div className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/20 border border-white/[0.05] mb-5">
            <div>
              <p className="font-semibold text-text-primary">Telegram Alerts</p>
              <p className="text-xs text-text-muted mt-1">Execution confirmations and error notifications</p>
            </div>
            <ToggleSwitch checked={telegramOn} onChange={() => setTelegramOn(!telegramOn)} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2 block">
              Telegram Chat ID
            </label>
            <input type="text" placeholder="@your_username or chat ID" className="input-field max-w-md" />
          </div>
        </SectionCard>
      )}

      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-text-muted text-sm">
        <Settings2 size={16} className="text-brand shrink-0" />
        <Database size={16} className="shrink-0 opacity-50" />
        <span>Settings sync to backend when API endpoints are connected.</span>
      </div>
    </div>
  );
}
