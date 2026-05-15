"use client";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Bot, Play, Square, Trash2, Plus, Loader2, RefreshCw,
  TrendingUp, Activity, Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, Bot as BotType, BotStats, Strategy } from "@/lib/api";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];
const STRATEGY_PRESETS = [
  { name: "RSI Bot", config: { strategy_name: "rsi", period: 14, oversold: 30, overbought: 70 } },
  { name: "MA Crossover", config: { strategy_name: "ma_crossover", fast_period: 9, slow_period: 21 } },
];

const STATUS_COLOR: Record<string, string> = {
  running: "text-green-trade bg-green-trade/10",
  stopped: "text-text-muted bg-text-muted/10",
  idle:    "text-text-secondary bg-bg-secondary",
  paused:  "text-yellow-500 bg-yellow-500/10",
  error:   "text-red-trade bg-red-trade/10",
};

export function BotPanel() {
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

  const fetchAll = useCallback(async () => {
    try {
      const [botList, stratList] = await Promise.all([
        api.bots.list(),
        api.strategies.list(),
      ]);
      setBots(botList);
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
      statsEntries.forEach((e) => { if (e) map[e[0]] = e[1]; });
      setStatsMap(map);

      if (stratList.length > 0) {
        setFormStrategyId((prev) => prev ?? stratList[0].id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load bots");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const ensureStrategy = async (preset: typeof STRATEGY_PRESETS[0]): Promise<number> => {
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
      const strategyId = formStrategyId ?? await ensureStrategy(STRATEGY_PRESETS[0]);
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

  const handleQuickCreate = async (preset: typeof STRATEGY_PRESETS[0]) => {
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

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-brand" />
          <span className="font-semibold text-text-primary">
            {bots.length} bot{bots.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-text-muted">
            ({bots.filter((b) => b.status === "running").length} running)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate((v) => !v)} className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3">
            <Plus size={14} /> New Bot
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card-elevated p-4 space-y-4 shrink-0">
          <h4 className="font-semibold text-text-primary">Create Trading Bot</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Bot Name</label>
              <input className="input-field" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="My RSI Bot" />
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Strategy</label>
              <select className="input-field" value={formStrategyId ?? ""} onChange={(e) => setFormStrategyId(Number(e.target.value))}>
                {strategies.length === 0 && <option value="">No strategies — will auto-create RSI</option>}
                {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Symbol</label>
              <select className="input-field" value={formSymbol} onChange={(e) => setFormSymbol(e.target.value)}>
                {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Timeframe</label>
              <select className="input-field" value={formTimeframe} onChange={(e) => setFormTimeframe(e.target.value)}>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-muted self-center">Quick create:</span>
            {STRATEGY_PRESETS.map((p) => (
              <button key={p.name} onClick={() => handleQuickCreate(p)} disabled={creating}
                className="text-xs px-2 py-1 rounded bg-bg-secondary hover:bg-brand/20 text-text-secondary hover:text-brand transition-colors disabled:opacity-50">
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Bot
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-text-muted" />
          </div>
        ) : bots.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <Bot size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-secondary text-sm">No bots yet</p>
            <p className="text-text-muted text-xs mt-1">Create a bot to start automated trading with RSI or MA Crossover strategies.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 text-sm">Create Your First Bot</button>
          </div>
        ) : (
          bots.map((bot) => {
            const stats = statsMap[bot.id];
            const isRunning = bot.status === "running";
            const busy = actionId === bot.id;
            return (
              <div key={bot.id} className="card-elevated p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-text-primary">{bot.name}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLOR[bot.status] ?? STATUS_COLOR.idle}`}>
                        {bot.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{bot.symbol} · {bot.timeframe} · {bot.broker}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isRunning ? (
                      <button onClick={() => handleStop(bot.id)} disabled={busy} title="Stop bot"
                        className="p-2 rounded-lg bg-red-trade/10 text-red-trade hover:bg-red-trade/20 transition-colors disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                      </button>
                    ) : (
                      <button onClick={() => handleStart(bot.id)} disabled={busy} title="Start bot"
                        className="p-2 rounded-lg bg-green-trade/10 text-green-trade hover:bg-green-trade/20 transition-colors disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      </button>
                    )}
                    <button onClick={() => handleDelete(bot.id)} disabled={busy || isRunning} title="Delete bot"
                      className="p-2 rounded-lg text-text-muted hover:text-red-trade hover:bg-red-trade/10 transition-colors disabled:opacity-30">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-bg-border">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted">P&L</p>
                      <p className={`text-xs font-mono font-semibold ${(stats?.total_pnl ?? bot.total_pnl) >= 0 ? "text-green-trade" : "text-red-trade"}`}>
                        {(stats?.total_pnl ?? bot.total_pnl) >= 0 ? "+" : ""}${(stats?.total_pnl ?? bot.total_pnl).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity size={12} className="text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted">Trades / Win</p>
                      <p className="text-xs font-mono text-text-primary">{stats?.total_trades ?? bot.total_trades} · {stats?.win_rate ?? 0}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-text-muted" />
                    <div>
                      <p className="text-[10px] text-text-muted">Last Run</p>
                      <p className="text-xs text-text-secondary">
                        {bot.last_run_at ? format(new Date(bot.last_run_at), "HH:mm:ss") : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}