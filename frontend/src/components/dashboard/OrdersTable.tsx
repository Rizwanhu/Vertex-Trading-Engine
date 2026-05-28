"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api, Order } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox } from "lucide-react";

type Tab = "open" | "history";

const STATUS_STYLE: Record<string, string> = {
  filled: "bg-green-trade/10 text-green-trade border-green-trade/20",
  open: "bg-brand/10 text-brand border-brand/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  cancelled: "bg-text-muted/10 text-text-muted border-bg-border",
  failed: "bg-red-trade/10 text-red-trade border-red-trade/20",
  rejected: "bg-red-trade/10 text-red-trade border-red-trade/20",
};

function OrderRowMobile({
  order,
  onCancel,
  cancelling,
}: {
  order: Order;
  onCancel: (id: number) => void;
  cancelling: number | null;
}) {
  const canCancel = order.status === "open" || order.status === "pending";

  return (
    <div className="p-4 border-b border-bg-border last:border-0 hover:bg-bg-elevated/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-semibold text-text-primary">{order.symbol}</span>
          <span className="text-xs text-text-muted ml-2">#{order.id}</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
            STATUS_STYLE[order.status] ?? "bg-text-muted/10 text-text-muted",
          )}
        >
          {order.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-muted">Side</span>
          <p>
            <span className={order.side === "buy" ? "badge-green" : "badge-red"}>
              {order.side.toUpperCase()}
            </span>
          </p>
        </div>
        <div>
          <span className="text-text-muted">Qty</span>
          <p className="font-mono text-text-primary">{order.quantity}</p>
        </div>
        <div>
          <span className="text-text-muted">Price</span>
          <p className="font-mono">{order.price != null ? formatPrice(order.price) : "—"}</p>
        </div>
        <div>
          <span className="text-text-muted">Time</span>
          <p>{format(new Date(order.created_at), "MMM dd, HH:mm")}</p>
        </div>
      </div>
      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(order.id)}
          disabled={cancelling === order.id}
          className="mt-3 text-xs font-medium text-red-trade hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          {cancelling === order.id && <Loader2 size={10} className="animate-spin" />}
          Cancel order
        </button>
      )}
    </div>
  );
}

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
      // not authenticated
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchOrders();
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-bg-border bg-bg-elevated shrink-0">
        {(["open", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all",
              tab === t
                ? "bg-brand text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary",
            )}
          >
            {t === "open" ? "Open" : "History"}
          </button>
        ))}
        <button
          type="button"
          onClick={fetchOrders}
          className="ml-auto p-1.5 rounded-md hover:bg-bg-secondary text-text-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={22} className="animate-spin text-text-muted" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={`No ${tab === "open" ? "open" : "historical"} orders`}
            description={tab === "open" ? "Place a trade from the panel to get started." : "Filled orders appear here."}
            className="py-10"
          />
        ) : (
          <>
            <div className="md:hidden">
              {orders.map((order) => (
                <OrderRowMobile
                  key={order.id}
                  order={order}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))}
            </div>

            <div className="hidden md:block table-scroll">
              <table className="w-full text-left border-collapse min-w-[720px]">
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
                    <tr key={order.id} className="hover:bg-bg-elevated/40 transition-colors">
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
                        {order.price != null ? formatPrice(order.price) : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-right">
                        {order.filled_price != null ? (
                          <span className="text-green-trade">{formatPrice(order.filled_price)}</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
                        {order.quantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            STATUS_STYLE[order.status] ?? "bg-text-muted/10 text-text-muted",
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(order.status === "open" || order.status === "pending") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelling === order.id}
                            className="text-xs font-medium text-red-trade hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {cancelling === order.id && <Loader2 size={10} className="animate-spin" />}
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
