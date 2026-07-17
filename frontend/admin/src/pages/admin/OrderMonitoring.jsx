import { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { apiRequest } from "../../api/client";

const STATUSES = ["All", "Processing", "Ready For Dispatch", "Shipped", "Delivered", "Returned", "Cancelled"];

const BADGE = {
  Processing: "bg-amber-50 text-amber-700",
  "Ready For Dispatch": "bg-blue-50 text-blue-700",
  Shipped: "bg-indigo-50 text-indigo-700",
  Delivered: "bg-green-50 text-green-700",
  Returned: "bg-red-50 text-red-700",
  Cancelled: "bg-slate-100 text-slate-600",
};

export default function OrderMonitoring() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/orders").then((data) => setOrders(data.orders)).catch(() => {});
  }
  useEffect(refresh, []);

  async function markComplete(order) {
    setMarkingId(order.id);
    try {
      await apiRequest(`/orders/${order.id}/complete`, { method: "PATCH" });
      setFeedback(`${order.id} marked completed`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setMarkingId(null);
    }
  }

  const filtered = orders.filter((o) => {
    const matchS = status === "All" || o.sellerStatus === status;
    const matchQ = o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()) || (o.sellerName || "").toLowerCase().includes(query.toLowerCase());
    return matchS && matchQ;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Order Monitoring</h1>
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 w-72"
          placeholder="Search order / customer / store…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${status === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
            {s} ({s === "All" ? orders.length : orders.filter((o) => o.sellerStatus === s).length})
          </button>
        ))}
      </div>

      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Store</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Delivery</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-mono font-semibold text-blue-700">{o.id}</p>
                  <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod}</p>
                </td>
                <td className="px-6 py-4 text-sm">{o.customerName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{o.sellerName || o.sellerId || "—"}</td>
                <td className="px-6 py-4 text-sm font-semibold">₹{o.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[o.sellerStatus] || "bg-slate-100"}`}>{o.sellerStatus}</span>
                  {o.completed && <span className="block mt-1 text-[10px] font-bold text-green-600">COMPLETED</span>}
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">{o.deliveryStatus || "—"}{o.trackingId ? ` · ${o.trackingId}` : ""}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDetail(o)} className="text-blue-600 hover:text-blue-800"><FaEye /></button>
                    {o.sellerStatus === "Delivered" && !o.completed && (
                      <button disabled={markingId === o.id} onClick={() => markComplete(o)} className="text-xs font-semibold text-green-600 hover:text-green-800">
                        {markingId === o.id ? "…" : "Mark Completed"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">No orders match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{detail.id}</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <p className="text-sm"><b>{detail.customerName}</b> · {detail.customerPhone}</p>
            <p className="text-sm text-slate-500">{detail.customerAddress}</p>
            <p className="text-sm text-slate-500">Store: {detail.sellerName}</p>
            <div className="text-sm space-y-1 border-t pt-2">
              {detail.items.map((item, idx) => (
                <div key={idx} className="flex justify-between"><span>{item.name} × {item.qty}</span><span>₹{item.price * item.qty}</span></div>
              ))}
              <div className="flex justify-between font-bold border-t pt-1"><span>Total ({detail.paymentMethod})</span><span>₹{detail.amount}</span></div>
            </div>
            {detail.statusHistory?.length > 0 && (
              <div className="text-xs text-slate-500 border-t pt-2 space-y-1">
                {detail.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex justify-between"><span>{h.status}</span><span>{new Date(h.timestamp).toLocaleString()}</span></div>
                ))}
              </div>
            )}
            {detail.cancellation?.requested && (
              <p className="text-xs font-semibold text-amber-600 border-t pt-2">Cancellation {detail.cancellation.status}: {detail.cancellation.reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
