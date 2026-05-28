"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Bot,
  Play,
  Square,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, Bot as BotType, BotStats, Strategy } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";
import { TRADING_SYMBOLS } from "@/components/ui/SymbolSelect";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];
const STRATEGY_PRESETS = [
  { name: "RSI Bot", config: { strategy_name: "rsi", period: 14, oversold: 30, overbought: 70 } },
  { name: "MA Crossover", config: { strategy_name: "ma_crossover", fast_period: 9, slow_period: 21 } },
];

function statusClass(status: string): string {
  const map: Record<string, string> = {
    running: "dash-bot-status--running",
    stopped: "dash-bot-status--stopped",
    idle: "dash-bot-status--idle",
    paused: "dash-bot-status--paused",
    error: "dash-bot-status--error",
  };
  return map[status] ?? "dash-bot-status--idle";
}

interface BotPanelProps {
  onBotsChange?: (bots: BotType[]) => void;
}

export function BotPanel({ onBotsChange }: BotPanelProps) {
  const [bots, setBots] = useState<BotType[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, BotStats>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [formName, setFormName] = useState("RSI Bot");
  const [formSymbol, setFormSymbol] = useState("BTCUSDT");
  const [formTimeframe, setFormTimeframe] = useState("1h");
  const [formStrategyId, setFormStrategyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const updateBots = useCallback(
    (list: BotType[]) => {
      setBots(list);
      onBotsChange?.(list);
    },
    [onBotsChange],
  );

  const fetchAll = useCallback(async () => {
    try {
      const [botList, stratList] = await Promise.all([api.bots.list(), api.strategies.list()]);
      updateBots(botList);
      setStrategies(stratList);

      const statsEntries = await Promise.all(
        botList.map(async (b) => {
          try {
            const s = await api.bots.stats(b.id);
            return [b.id, s] as const;
          } catch {
            return null;
          }
        }),
      );
      const map: Record<number, BotStats> = {};
      statsEntries.forEach((e) => {
        if (e) map[e[0]] = e[1];
      });
      setStatsMap(map);

      if (stratList.length > 0) {
        setFormStrategyId((prev) => prev ?? stratList[0].id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load bots");
    } finally {
      setLoading(false);
    }
  }, [updateBots]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleStart = async (id: number) => {
    setActionId(id);
    try {
      const res = await api.bots.start(id);
      toast.success(res.message);
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start bot");
    } finally {
      setActionId(null);
    }
  };

  const handleStop = async (id: number) => {
    setActionId(id);
    try {
      const res = await api.bots.stop(id);
      toast.success(res.message);
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to stop bot");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bot permanently?")) return;
    setActionId(id);
    try {
      await api.bots.delete(id);
      toast.success("Bot deleted");
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bot");
    } finally {
      setActionId(null);
    }
  };

  const ensureStrategy = async (preset: (typeof STRATEGY_PRESETS)[0]): Promise<number> => {
    const existing = strategies.find(
      (s) => (s.config as Record<string, string>)?.strategy_name === preset.config.strategy_name,
    );
    if (existing) return existing.id;

    const created = await api.strategies.create({
      name: preset.name,
      type: "rule",
      description: `Auto-created ${preset.name} strategy`,
      config: preset.config,
    });
    setStrategies((prev) => [...prev, created]);
    return created.id;
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("Enter a bot name");
      return;
    }
    setCreating(true);
    try {
      const strategyId = formStrategyId ?? (await ensureStrategy(STRATEGY_PRESETS[0]));
      await api.bots.create({
        name: formName,
        strategy_id: strategyId,
        symbol: formSymbol,
        timeframe: formTimeframe,
        broker: "binance",
        risk_config: {
          max_position_pct: 2.0,
          stop_loss_pct: 1.5,
          take_profit_pct: 3.0,
          max_open_trades: 3,
          daily_loss_limit_pct: 5.0,
          account_size_usdt: 1000.0,
        },
      });
      toast.success(`Bot "${formName}" created`);
      setShowCreate(false);
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setCreating(false);
    }
  };

  const handleQuickCreate = async (preset: (typeof STRATEGY_PRESETS)[0]) => {
    setCreating(true);
    try {
      const strategyId = await ensureStrategy(preset);
      await api.bots.create({
        name: `${preset.name} — ${formSymbol}`,
        strategy_id: strategyId,
        symbol: formSymbol,
        timeframe: formTimeframe,
        broker: "binance",
      });
      toast.success(`${preset.name} created for ${formSymbol}`);
      fetchAll();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Quick create failed");
    } finally {
      setCreating(false);
    }
  };

  const runningCount = bots.filter((b) => b.status === "running").length;

  return (
    <div className="dash-bots-panel">
      <div className="dash-bots-toolbar">
        <div className="dash-bots-toolbar-left">
          <Bot size={18} style={{ color: "var(--auth-accent)" }} />
          <span className="dash-bots-count">
            {bots.length} bot{bots.length !== 1 ? "s" : ""}
          </span>
          <span className="dash-bots-running-badge">
            <span className="dash-live-dot" />
            {runningCount} running
          </span>
        </div>
        <div className="dash-bots-toolbar-actions">
          <button
            type="button"
            onClick={fetchAll}
            className="dash-icon-btn-ghost"
            title="Refresh"
            aria-label="Refresh bots"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="dash-btn-primary"
          >
            <Plus size={15} /> New bot
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="dash-bots-create">
          <h4 className="dash-bots-create-title">Create trading bot</h4>
          <div className="dash-form-grid">
            <div className="dash-trade-field">
              <label className="dash-field-label" htmlFor="bot-name">
                Bot name
              </label>
              <input
                id="bot-name"
                className="dash-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="My RSI Bot"
              />
            </div>
            <div className="dash-trade-field">
              <label className="dash-field-label" htmlFor="bot-strategy">
                Strategy
              </label>
              <select
                id="bot-strategy"
                className="dash-select"
                value={formStrategyId ?? ""}
                onChange={(e) => setFormStrategyId(Number(e.target.value))}
              >
                {strategies.length === 0 && <option value="">Auto-create RSI</option>}
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="dash-trade-field">
              <label className="dash-field-label" htmlFor="bot-symbol">
                Symbol
              </label>
              <select
                id="bot-symbol"
                className="dash-select"
                value={formSymbol}
                onChange={(e) => setFormSymbol(e.target.value)}
              >
                {TRADING_SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("USDT", "/USDT")}
                  </option>
                ))}
              </select>
            </div>
            <div className="dash-trade-field">
              <label className="dash-field-label" htmlFor="bot-tf">
                Timeframe
              </label>
              <select
                id="bot-tf"
                className="dash-select"
                value={formTimeframe}
                onChange={(e) => setFormTimeframe(e.target.value)}
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dash-quick-row">
            <span className="dash-label">Quick deploy</span>
            {STRATEGY_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleQuickCreate(p)}
                disabled={creating}
                className="dash-quick-chip"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="dash-form-actions">
            <button type="button" onClick={() => setShowCreate(false)} className="dash-btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="dash-btn-primary"
            >
              {creating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Create bot
            </button>
          </div>
        </div>
      )}

      <div className="dash-bots-list">
        {loading ? (
          <div className="dash-bots-loading">
            <Loader2 size={26} className="animate-spin" />
          </div>
        ) : bots.length === 0 ? (
          <div className="dash-empty-state">
            <div className="dash-empty-state-icon">
              <Bot size={22} />
            </div>
            <h4>No bots yet</h4>
            <p>Create an RSI or MA crossover bot to automate your strategy on a schedule.</p>
            <button type="button" onClick={() => setShowCreate(true)} className="dash-btn-primary">
              <Plus size={15} /> Create your first bot
            </button>
          </div>
        ) : (
          <div className="dash-bots-grid">
            {bots.map((bot) => {
              const stats = statsMap[bot.id];
              const isRunning = bot.status === "running";
              const busy = actionId === bot.id;
              const pnl = stats?.total_pnl ?? bot.total_pnl;

              return (
                <article
                  key={bot.id}
                  className={cn("dash-bot-card", isRunning && "is-running")}
                >
                  <div className="dash-bot-card-header">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="dash-bot-card-name">{bot.name}</h4>
                        <span className={cn("dash-bot-status", statusClass(bot.status))}>
                          {isRunning && <span className="dash-live-dot" />}
                          {bot.status}
                        </span>
                      </div>
                      <p className="dash-bot-card-meta">
                        {bot.symbol.replace("USDT", "/USDT")} · {bot.timeframe} · {bot.broker}
                      </p>
                    </div>
                    <div className="dash-bot-card-actions">
                      {isRunning ? (
                        <button
                          type="button"
                          onClick={() => handleStop(bot.id)}
                          disabled={busy}
                          title="Stop"
                          className="dash-bot-action-btn dash-bot-action-btn--stop"
                        >
                          {busy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStart(bot.id)}
                          disabled={busy}
                          title="Start"
                          className="dash-bot-action-btn dash-bot-action-btn--start"
                        >
                          {busy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(bot.id)}
                        disabled={busy || isRunning}
                        title="Delete"
                        className="dash-bot-action-btn dash-bot-action-btn--delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="dash-bot-metrics">
                    <div>
                      <p className="dash-bot-metric-label">
                        <TrendingUp size={10} /> P&L
                      </p>
                      <p
                        className={cn(
                          "dash-bot-metric-value",
                          pnl >= 0 ? "is-positive" : "is-negative",
                        )}
                      >
                        {formatSignedCurrency(pnl)}
                      </p>
                    </div>
                    <div>
                      <p className="dash-bot-metric-label">
                        <Activity size={10} /> Trades
                      </p>
                      <p className="dash-bot-metric-value">
                        {stats?.total_trades ?? bot.total_trades}
                        <span style={{ color: "var(--auth-muted)", fontWeight: 500 }}>
                          {" "}
                          · {stats?.win_rate ?? 0}%
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="dash-bot-metric-label">
                        <Clock size={10} /> Last run
                      </p>
                      <p className="dash-bot-metric-value" style={{ fontWeight: 500 }}>
                        {bot.last_run_at ? format(new Date(bot.last_run_at), "HH:mm") : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
