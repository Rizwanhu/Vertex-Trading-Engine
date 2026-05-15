"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api, Order } from "@/lib/api";

type Tab = "open" | "history";

const STATUS_STYLE: Record<string, string> = {
  filled:    "bg-green-trade/10 text-green-trade",
  open:      "bg-brand/10 text-brand",
  pending:   "bg-yellow-500/10 text-yellow-500",
  cancelled: "bg-text-muted/20 text-text-muted",
  failed:    "bg-red-trade/10 text-red-trade",
  rejected:  "bg-red-trade/10 text-red-trade",
};

export function OrdersTable() {
  const [tab, setTab] = useState<Tab>("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = tab === "open" ? await api.orders.list() : await api.orders.history(50);
      setOrders(data);
    } catch {
      // User may not be authenticated yet
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh open orders every 10 s
    if (tab === "open") {
      const interval = setInterval(fetchOrders, 10_000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, tab]);

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await api.orders.cancel(id);
      toast.success(`Order #${id} cancelled`);
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-bg-border bg-bg-elevated shrink-0">
        {(["open", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${
              tab === t
                ? "bg-brand text-white"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary"
            }`}
          >
            {t === "open" ? "Open / Pending" : "History"}
          </button>
        ))}
        <button
          onClick={fetchOrders}
          className="ml-auto p-1.5 rounded hover:bg-bg-secondary text-text-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={22} className="animate-spin text-text-muted" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-text-muted">
            No {tab === "open" ? "open" : "historical"} orders
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-bg-elevated sticky top-0 border-b border-bg-border z-10">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary">#</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Time</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Pair</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Type</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Side</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Price</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Filled</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Qty</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-center">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-bg-elevated/50 transition-colors">
                  <td className="py-3 px-4 text-xs text-text-muted">#{order.id}</td>
                  <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
                    {format(new Date(order.created_at), "MMM dd, HH:mm")}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">{order.symbol}</td>
                  <td className="py-3 px-4 text-xs text-text-secondary uppercase">{order.order_type}</td>
                  <td className="py-3 px-4">
                    <span className={order.side === "buy" ? "badge-green" : "badge-red"}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
                    {order.price != null ? `$${order.price.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-right">
                    {order.filled_price != null
                      ? <span className="text-green-trade">${order.filled_price.toLocaleString()}</span>
                      : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">{order.quantity}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[order.status] ?? "bg-text-muted/20 text-text-muted"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(order.status === "open" || order.status === "pending") && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelling === order.id}
                        className="text-xs font-medium text-red-trade hover:text-red-trade/80 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {cancelling === order.id ? <Loader2 size={10} className="animate-spin" /> : null}
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
