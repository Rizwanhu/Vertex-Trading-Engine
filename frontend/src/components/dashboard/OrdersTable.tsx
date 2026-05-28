"use client";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, RefreshCw, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { api, Order } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { DashSegmented } from "@/components/dashboard/ui/DashSegmented";

type Tab = "open" | "history";

const STATUS_STYLE: Record<string, string> = {
  filled: "text-[var(--auth-accent)] bg-[var(--auth-accent-dim)] border-[rgba(0,255,163,0.25)]",
  open: "text-[#60a5fa] bg-[rgba(96,165,250,0.1)] border-[rgba(96,165,250,0.25)]",
  pending: "text-[#fbbf24] bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.25)]",
  cancelled: "text-[var(--auth-muted)] bg-transparent border-[var(--auth-border)]",
  failed: "text-[#f87171] bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)]",
  rejected: "text-[#f87171] bg-[rgba(248,113,113,0.1)] border-[rgba(248,113,113,0.25)]",
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
    <div className="p-4 border-b border-[var(--auth-border)] last:border-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-semibold text-[var(--auth-text)]">{order.symbol}</span>
          <span className="text-xs text-[var(--auth-muted)] ml-2">#{order.id}</span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold uppercase px-2 py-0.5 rounded border",
            STATUS_STYLE[order.status] ?? "text-[var(--auth-muted)]",
          )}
        >
          {order.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[var(--auth-muted)]">Side</span>
          <p className="mt-0.5">
            <span className={order.side === "buy" ? "dash-badge-buy" : "dash-badge-sell"}>
              {order.side.toUpperCase()}
            </span>
          </p>
        </div>
        <div>
          <span className="text-[var(--auth-muted)]">Qty</span>
          <p className="font-mono text-[var(--auth-text)] mt-0.5">{order.quantity}</p>
        </div>
        <div>
          <span className="text-[var(--auth-muted)]">Price</span>
          <p className="font-mono mt-0.5">{order.price != null ? formatPrice(order.price) : "—"}</p>
        </div>
        <div>
          <span className="text-[var(--auth-muted)]">Time</span>
          <p className="mt-0.5">{format(new Date(order.created_at), "MMM dd, HH:mm")}</p>
        </div>
      </div>
      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(order.id)}
          disabled={cancelling === order.id}
          className="mt-3 text-xs font-semibold text-[#f87171] hover:underline disabled:opacity-50 inline-flex items-center gap-1"
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
      /* not authenticated */
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
    <div className="flex flex-col min-h-[280px]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--auth-border)]">
        <DashSegmented
          options={[
            { value: "open", label: "Open" },
            { value: "history", label: "History" },
          ]}
          value={tab}
          onChange={setTab}
          columns={2}
          className="flex-1 max-w-[220px]"
        />
        <button
          type="button"
          onClick={fetchOrders}
          className="p-2 rounded-lg text-[var(--auth-muted)] hover:text-[var(--auth-text)] hover:bg-white/[0.04] transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-36">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--auth-accent)" }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="dash-empty-state">
            <div className="dash-empty-state-icon">
              <Inbox size={22} />
            </div>
            <h4>No {tab === "open" ? "open" : "historical"} orders</h4>
            <p>
              {tab === "open"
                ? "Place a trade from the panel on the right to get started."
                : "Filled and cancelled orders appear here."}
            </p>
          </div>
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

            <div className="hidden md:block dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Time</th>
                    <th>Pair</th>
                    <th>Type</th>
                    <th>Side</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Filled</th>
                    <th className="text-right">Qty</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="!text-[var(--auth-muted)]">#{order.id}</td>
                      <td className="whitespace-nowrap !text-[var(--auth-muted)]">
                        {format(new Date(order.created_at), "MMM dd, HH:mm")}
                      </td>
                      <td className="!text-[var(--auth-text)] !font-semibold">{order.symbol}</td>
                      <td className="uppercase">{order.order_type}</td>
                      <td>
                        <span className={order.side === "buy" ? "dash-badge-buy" : "dash-badge-sell"}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right font-mono !text-[var(--auth-text)]">
                        {order.price != null ? formatPrice(order.price) : "—"}
                      </td>
                      <td className="text-right font-mono">
                        {order.filled_price != null ? (
                          <span className="text-[var(--auth-accent)]">
                            {formatPrice(order.filled_price)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-right font-mono !text-[var(--auth-text)]">
                        {order.quantity}
                      </td>
                      <td className="text-center">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                            STATUS_STYLE[order.status],
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {(order.status === "open" || order.status === "pending") && (
                          <button
                            type="button"
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelling === order.id}
                            className="text-xs font-semibold text-[#f87171] hover:underline disabled:opacity-50"
                          >
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
