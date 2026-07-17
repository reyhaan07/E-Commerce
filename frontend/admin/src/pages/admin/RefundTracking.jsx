import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { getDeliveryPartners } from "../../api/deliveryPartners";

const RETURN_BADGE = {
  Requested: "bg-amber-50 text-amber-700",
  "Admin Review": "bg-blue-50 text-blue-700",
  "Seller Approved": "bg-indigo-50 text-indigo-700",
  "Pickup Scheduled": "bg-indigo-50 text-indigo-700",
  "Picked Up": "bg-indigo-50 text-indigo-700",
  "Under Inspection": "bg-purple-50 text-purple-700",
  "Refund Approved": "bg-green-50 text-green-700",
  Refunded: "bg-green-100 text-green-800",
  Rejected: "bg-red-50 text-red-700",
};

// Cancellation Requests + Return Requests + Refund Tracking, all the admin
// actions for Features 10 & 11 in one place.
export default function RefundTracking() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [partners, setPartners] = useState([]);
  const [pickupChoice, setPickupChoice] = useState({});
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/orders").then((d) => setOrders(d.orders)).catch(() => {});
    apiRequest("/returns").then((d) => setReturns(d.returns)).catch(() => {});
    getDeliveryPartners().then(setPartners).catch(() => {});
  }
  useEffect(refresh, []);

  async function act(fn, doneText) {
    try {
      await fn();
      setFeedback(doneText);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const decideCancellation = (order, decision) =>
    act(() => apiRequest(`/orders/${order.id}/cancellation`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note: decision === "Approved" ? "Approved before dispatch" : "Order already being packed" }),
    }), `Cancellation for ${order.id} ${decision.toLowerCase()}`);

  const setReturnStatus = (ret, status) =>
    act(() => apiRequest(`/returns/${ret.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }), `${ret.id} → ${status}`);

  const assignPickup = (ret) => {
    const partnerId = pickupChoice[ret.id];
    if (!partnerId) return setFeedback("Choose a delivery partner for the pickup first");
    act(() => apiRequest(`/returns/${ret.id}/assign-pickup`, { method: "PATCH", body: JSON.stringify({ deliveryPartnerId: partnerId }) }), `${ret.id} pickup scheduled`);
  };

  const processRefund = (ret) =>
    act(() => apiRequest(`/returns/${ret.id}/refund`, { method: "POST" }), `${ret.id} refunded`);

  const cancellations = orders.filter((o) => o.cancellation?.requested);
  const pendingCancellations = cancellations.filter((o) => o.cancellation.status === "Requested");
  const resolvedCancellations = cancellations.filter((o) => o.cancellation.status !== "Requested");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Refund Tracking</h1>
      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      {/* Cancellation requests (Feature 10) */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">Cancellation Requests ({pendingCancellations.length} pending)</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Order</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status / Refund</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...pendingCancellations, ...resolvedCancellations].map((o) => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono font-semibold text-blue-700">{o.id}</td>
                  <td className="px-6 py-4 text-sm">{o.customerName}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{o.amount} <span className="text-xs text-slate-400">({o.paymentMethod})</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{o.cancellation.reason}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.cancellation.status === "Requested" ? "bg-amber-50 text-amber-700" : o.cancellation.status === "Approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {o.cancellation.status}
                    </span>
                    {o.cancellation.refundId && <p className="text-xs text-slate-500 mt-1">Refund {o.cancellation.refundId} · ₹{o.cancellation.refundAmount}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {o.cancellation.status === "Requested" ? (
                      <div className="flex gap-3">
                        <button onClick={() => decideCancellation(o, "Approved")} className="text-sm font-semibold text-green-600 hover:text-green-800">Approve & Refund</button>
                        <button onClick={() => decideCancellation(o, "Rejected")} className="text-sm font-semibold text-red-600 hover:text-red-800">Reject</button>
                      </div>
                    ) : <span className="text-xs text-slate-400">Resolved</span>}
                  </td>
                </tr>
              ))}
              {cancellations.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No cancellation requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Return pipeline (Feature 11) */}
      <section className="space-y-3">
        <h2 className="font-bold text-lg">Return Requests & Refunds ({returns.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Return</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Order / Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Reason</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Refund</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono font-semibold text-blue-700">{r.id}</td>
                  <td className="px-6 py-4 text-sm">{r.orderId}<p className="text-xs text-slate-400">{r.customerName}</p></td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate">{r.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${RETURN_BADGE[r.status]}`}>{r.status}</span>
                    {r.pickupPartnerName && <p className="text-xs text-slate-400 mt-1">Pickup: {r.pickupPartnerName}</p>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {r.refund?.refundId ? `${r.refund.refundId} · ₹${r.refund.amount} (${r.refund.method})` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {r.status === "Requested" && (
                      <div className="flex gap-3">
                        <button onClick={() => setReturnStatus(r, "Admin Review")} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Start Review</button>
                        <button onClick={() => setReturnStatus(r, "Rejected")} className="text-sm font-semibold text-red-600 hover:text-red-800">Reject</button>
                      </div>
                    )}
                    {r.status === "Admin Review" && <span className="text-xs text-slate-400">Waiting on seller approval</span>}
                    {r.status === "Seller Approved" && (
                      <div className="flex items-center gap-2">
                        <select className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                          value={pickupChoice[r.id] || ""}
                          onChange={(e) => setPickupChoice((c) => ({ ...c, [r.id]: e.target.value }))}>
                          <option value="">Pickup partner…</option>
                          {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.zone || p.vehicle})</option>)}
                        </select>
                        <button onClick={() => assignPickup(r)} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Schedule</button>
                      </div>
                    )}
                    {["Pickup Scheduled", "Picked Up"].includes(r.status) && <span className="text-xs text-slate-400">With delivery partner</span>}
                    {r.status === "Under Inspection" && (
                      r.inspection?.result === "Pass"
                        ? <button onClick={() => setReturnStatus(r, "Refund Approved")} className="text-sm font-semibold text-green-600 hover:text-green-800">Approve Refund</button>
                        : <span className="text-xs text-slate-400">Waiting on seller inspection</span>
                    )}
                    {r.status === "Refund Approved" && (
                      <button onClick={() => processRefund(r)} className="text-sm font-semibold text-green-600 hover:text-green-800">Process Refund</button>
                    )}
                    {["Refunded", "Rejected"].includes(r.status) && <span className="text-xs text-slate-400">Closed</span>}
                  </td>
                </tr>
              ))}
              {returns.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">No return requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
