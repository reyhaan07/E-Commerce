import React, { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { getOrders, getEligiblePartners, assignDeliveryPartner } from "../../api/orders";
import { FaStore, FaTruck, FaBox, FaUser, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function DeliveryAssignment() {
  const [orders, setOrders] = useState([]);
  const [eligibility, setEligibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  function loadData() {
    setLoading(true);
    getOrders({ sellerStatus: "Ready For Dispatch", pickupRequested: "true" })
      .then(async (ordersData) => {
        setOrders(ordersData);
        const results = await Promise.all(
          ordersData.map((order) =>
            getEligiblePartners(order.id)
              .then((data) => [order.id, data])
              .catch((err) => [order.id, { serviceable: false, partners: [], message: err.message }])
          )
        );
        setEligibility(Object.fromEntries(results));
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  async function handleAssign(order) {
    const deliveryPartnerId = selection[order.id];
    if (!deliveryPartnerId) {
      setFeedback({ type: "error", message: `Please select a delivery partner for Order ${order.id}` });
      return;
    }
    const info = eligibility[order.id];
    const partner = (info?.partners || []).find((p) => p.id === deliveryPartnerId);

    setAssigningId(order.id);
    setFeedback({ type: "", message: "" });
    try {
      await assignDeliveryPartner(order.id, deliveryPartnerId);
      setFeedback({
        type: "success",
        message: `Successfully assigned ${partner?.name || "partner"} to Order ${order.id} (Seller: ${order.sellerName || "Store"})`,
      });
      loadData();
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Could not assign delivery partner" });
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Assign Delivery Partner</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch orders that sellers have packed and marked ready for courier pickup
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-xs"
        >
          Refresh Queue
        </button>
      </div>

      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? <FaCheckCircle className="shrink-0 text-emerald-600" /> : <FaExclamationCircle className="shrink-0 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Order ID</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Seller / Store</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Customer</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Amount</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600">Assign Delivery Partner</th>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {!loading &&
                orders.map((order) => {
                  const info = eligibility[order.id];
                  const partners = info?.partners || [];
                  const blocked = info && !info.serviceable;
                  const selectedPartner = partners.find((p) => p.id === selection[order.id]);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {order.id}
                        <div className="text-[11px] font-sans text-slate-400 font-normal">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* SELLER NAME (Prominently displayed) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FaStore size={13} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">
                              {order.sellerName || "ShopSphere Store"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {order.sellerAddress ? order.sellerAddress.split(",")[0] : `ID: ${order.sellerId || "—"}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold text-slate-800">{order.customerName}</div>
                        <div className="text-xs text-slate-400">PIN: {order.customerPincode || "—"}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-bold text-slate-900 tnum">
                        ₹{Number(order.amount).toLocaleString("en-IN")}
                        <div className="text-xs font-normal text-slate-400">{order.paymentMethod}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={order.sellerStatus} />
                        {order.deliveryPartnerName && (
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <FaTruck size={10} className="text-blue-500" />
                            {order.deliveryPartnerName}
                          </div>
                        )}
                      </td>

                      {/* Partner Selection */}
                      <td className="px-6 py-4">
                        {blocked ? (
                          <div className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 max-w-xs">
                            {info.message}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <select
                              className="w-full max-w-xs border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              value={selection[order.id] || ""}
                              onChange={(e) => setSelection({ ...selection, [order.id]: e.target.value })}
                              disabled={!info || partners.length === 0}
                            >
                              <option value="">Select eligible courier...</option>
                              {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.vehicle}) {p.area ? `· ${p.area}` : ""}
                                </option>
                              ))}
                            </select>

                            {selectedPartner && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span className="font-semibold text-blue-700">{selectedPartner.name}</span>
                                <span>· Zone: {selectedPartner.zone || "Local"}</span>
                              </div>
                            )}

                            {info && partners.length === 0 && (
                              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-1">
                                {info.message || "No couriers available near this store"}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          className="btn-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs disabled:opacity-40"
                          disabled={assigningId === order.id || blocked || partners.length === 0 || !selection[order.id]}
                          onClick={() => handleAssign(order)}
                        >
                          {assigningId === order.id
                            ? "Assigning..."
                            : order.deliveryPartnerId
                            ? "Reassign"
                            : "Assign Partner"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading assignment queue...
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm space-y-2">
            <FaBox className="mx-auto text-3xl text-slate-300" />
            <p className="font-semibold text-slate-600">No orders awaiting delivery assignment</p>
            <p className="text-xs text-slate-400">
              Orders marked “Ready For Dispatch” with courier pickup requested by sellers appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
