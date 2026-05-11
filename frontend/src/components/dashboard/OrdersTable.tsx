"use client";
import { format } from "date-fns";

const MOCK_ORDERS = [
  { id: "ORD-1", symbol: "BTCUSDT", side: "buy",  type: "market", qty: 0.1,  price: 67420.5, status: "filled",  date: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "ORD-2", symbol: "ETHUSDT", side: "sell", type: "limit",  qty: 2.5,  price: 3550.0,  status: "open",    date: new Date(Date.now() - 1000 * 60 * 60) },
  { id: "ORD-3", symbol: "SOLUSDT", side: "buy",  type: "limit",  qty: 15.0, price: 165.0,   status: "open",    date: new Date(Date.now() - 1000 * 60 * 120) },
  { id: "ORD-4", symbol: "BTCUSDT", side: "buy",  type: "market", qty: 0.05, price: 66800.0, status: "filled",  date: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: "ORD-5", symbol: "BNBUSDT", side: "sell", type: "market", qty: 5.0,  price: 590.2,   status: "failed",  date: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

export function OrdersTable() {
  return (
    <table className="w-full text-left border-collapse min-w-[700px]">
      <thead className="bg-bg-elevated sticky top-0 border-b border-bg-border z-10">
        <tr>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Time</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Pair</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Type</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary">Side</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Price</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Amount</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-center">Status</th>
          <th className="py-3 px-4 text-xs font-semibold text-text-secondary text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-bg-border">
        {MOCK_ORDERS.map((order) => (
          <tr key={order.id} className="hover:bg-bg-elevated/50 transition-colors">
            <td className="py-3 px-4 text-xs text-text-muted whitespace-nowrap">
              {format(order.date, "MMM dd, HH:mm")}
            </td>
            <td className="py-3 px-4 text-sm font-medium text-text-primary">
              {order.symbol}
            </td>
            <td className="py-3 px-4 text-xs text-text-secondary uppercase">
              {order.type}
            </td>
            <td className="py-3 px-4">
              <span className={order.side === "buy" ? "badge-green" : "badge-red"}>
                {order.side.toUpperCase()}
              </span>
            </td>
            <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
              ${order.price.toLocaleString()}
            </td>
            <td className="py-3 px-4 text-sm font-mono text-text-primary text-right">
              {order.qty}
            </td>
            <td className="py-3 px-4 text-center">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  order.status === "filled"
                    ? "bg-green-trade/10 text-green-trade"
                    : order.status === "open"
                    ? "bg-brand/10 text-brand"
                    : "bg-text-muted/20 text-text-muted"
                }`}
              >
                {order.status}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              {order.status === "open" && (
                <button className="text-xs font-medium text-red-trade hover:text-red-trade/80 transition-colors">
                  Cancel
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
