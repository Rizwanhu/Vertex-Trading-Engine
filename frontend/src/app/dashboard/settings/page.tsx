"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Shield, Bell, Database, Settings2, Plus, Unplug } from "lucide-react";
import { DashSection } from "@/components/dashboard/ui/DashSection";
import { DashToggle } from "@/components/dashboard/ui/DashToggle";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "api", label: "API Keys", icon: Key },
  { id: "risk", label: "Risk", icon: Shield },
  { id: "notify", label: "Alerts", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RISK_FIELDS = [
  { label: "Max Position Size (%)", hint: "Maximum % of portfolio per trade", default: "2.0" },
  { label: "Daily Loss Limit (%)", hint: "Halt all trading if exceeded", default: "5.0" },
  { label: "Default Stop Loss (%)", hint: "Applied to new bots automatically", default: "1.5" },
  { label: "Max Open Trades", hint: "Concurrent positions allowed", default: "5" },
];

const tabMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("api");
  const [telegramOn, setTelegramOn] = useState(true);

  return (
    <div className="dash-settings-page">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="dash-settings-hero"
      >
        <div className="dash-settings-hero-main">
          <span className="dash-live-badge">
            <span className="dash-live-dot" />
            Configuration
          </span>
          <h1 className="dash-settings-hero-title">
            Account <span>Settings</span>
          </h1>
          <p className="dash-subheading">
            Manage broker connections, global risk limits, and notification preferences for your
            workspace.
          </p>
        </div>
        <div className="dash-settings-hero-meta">
          <div className="dash-hero-stat-pill">
            <span className="dash-label">Brokers</span>
            <p className="dash-hero-stat-value">Binance</p>
          </div>
          <div className="dash-hero-stat-pill">
            <span className="dash-label">Mode</span>
            <p className="dash-hero-stat-value">Production</p>
          </div>
        </div>
      </motion.section>

      <nav className="dash-settings-tabs" aria-label="Settings sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "dash-settings-tab",
              tab === id && "dash-settings-tab-active",
            )}
          >
            <Icon size={15} strokeWidth={2.25} />
            {label}
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {tab === "api" && (
          <motion.div key="api" className="dash-settings-content" {...tabMotion}>
            <DashSection title="Broker API Keys" icon={Key} glow>
              <p className="dash-settings-lead">
                Connect exchanges for live trading and portfolio sync.
              </p>
              <div className="dash-broker-list">
                <article className="dash-broker-card">
                  <div className="dash-broker-card-main">
                    <div className="dash-broker-logo dash-broker-logo--binance" aria-hidden>
                      B
                    </div>
                    <div className="dash-broker-info">
                      <h4 className="dash-broker-name">Binance</h4>
                      <p className="dash-broker-meta">
                        <span className="dash-live-dot dash-broker-dot" />
                        Production · Added May 2026
                      </p>
                    </div>
                  </div>
                  <button type="button" className="dash-btn-disconnect">
                    <Unplug size={14} />
                    Disconnect
                  </button>
                </article>
                <button type="button" className="dash-broker-add">
                  <Plus size={18} strokeWidth={2.25} />
                  Add new API key
                </button>
              </div>
            </DashSection>
          </motion.div>
        )}

        {tab === "risk" && (
          <motion.div key="risk" className="dash-settings-content" {...tabMotion}>
            <DashSection title="Global Risk Limits" icon={Shield} glow>
              <p className="dash-settings-lead">
                These limits apply to all manual trades and new bots.
              </p>
              <div className="dash-settings-form-grid">
                {RISK_FIELDS.map((field) => (
                  <div key={field.label} className="dash-settings-field">
                    <label className="dash-field-label">{field.label}</label>
                    <input
                      type="number"
                      defaultValue={field.default}
                      className="dash-input"
                      step="0.1"
                    />
                    <p className="dash-settings-hint">{field.hint}</p>
                  </div>
                ))}
              </div>
              <div className="dash-settings-actions">
                <button type="button" className="dash-btn-primary">
                  Save risk settings
                </button>
              </div>
            </DashSection>
          </motion.div>
        )}

        {tab === "notify" && (
          <motion.div key="notify" className="dash-settings-content" {...tabMotion}>
            <DashSection title="Notifications" icon={Bell} glow>
              <div className="dash-settings-toggle-row">
                <div>
                  <p className="dash-settings-toggle-title">Telegram alerts</p>
                  <p className="dash-settings-toggle-desc">
                    Execution confirmations and error notifications
                  </p>
                </div>
                <DashToggle
                  checked={telegramOn}
                  onChange={() => setTelegramOn(!telegramOn)}
                  aria-label="Toggle Telegram alerts"
                />
              </div>
              <div className="dash-settings-field dash-settings-field--spaced">
                <label className="dash-field-label">Telegram chat ID</label>
                <input
                  type="text"
                  placeholder="@your_username or chat ID"
                  className="dash-input dash-input--narrow"
                  disabled={!telegramOn}
                />
                <p className="dash-settings-hint">
                  Use your @username or numeric chat ID from BotFather.
                </p>
              </div>
            </DashSection>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="dash-settings-footnote">
        <Settings2 size={16} className="dash-settings-footnote-icon" />
        <Database size={16} className="dash-settings-footnote-icon dash-settings-footnote-icon--muted" />
        <span>Settings sync to backend when API endpoints are connected.</span>
      </footer>
    </div>
  );
}
