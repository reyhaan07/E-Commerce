import { useEffect, useState } from "react";
import StatusBadge from "../../components/StatusBadge";
import { getOrders, getEligiblePartners, assignDeliveryPartner } from "../../api/orders";

export default function DeliveryAssignment() {
  const [orders, setOrders] = useState([]);
  // orderId -> { serviceable, partners, message } straight from the backend.
  // The eligible-partners endpoint applies PIN serviceability and partner
  // availability, so the dropdown must never be built from the raw roster.
  const [eligibility, setEligibility] = useState({});
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  function loadData() {
    setLoading(true);
    // Only orders the seller has actually handed over are assignable — the
    // backend refuses anything earlier, so filter server-side rather than
    // listing every order and letting the assign call fail.
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

  async function handleAssign(orderId) {
    const deliveryPartnerId = selection[orderId];
    if (!deliveryPartnerId) {
      alert("Choose a delivery partner first");
      return;
    }
    setAssigningId(orderId);
    try {
      await assignDeliveryPartner(orderId, deliveryPartnerId);
      loadData();
    } catch (err) {
      alert(err.message || "Could not assign delivery partner");
    } finally {
      setAssigningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assign Delivery Partner</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Current Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Assign To</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.map((order) => {
              const info = eligibility[order.id];
              const partners = info?.partners || [];
              const blocked = info && !info.serviceable;
              return (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium">{order.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm font-semibold">₹{order.amount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.deliveryStatus} />
                    {order.deliveryPartnerName && (
                      <div className="text-xs text-slate-500 mt-1">{order.deliveryPartnerName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {blocked ? (
                      <div className="text-xs text-slate-500">{info.message}</div>
                    ) : (
                      <>
                        <select
                          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                          value={selection[order.id] || ""}
                          onChange={(e) => setSelection({ ...selection, [order.id]: e.target.value })}
                          disabled={!info || partners.length === 0}
                        >
                          <option value="">Select partner...</option>
                          {partners.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}{p.area ? ` — ${p.area}` : ""}
                            </option>
                          ))}
                        </select>
                        {info && partners.length === 0 && (
                          <div className="text-xs text-slate-500 mt-1">{info.message}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="btn-primary text-sm px-4 py-1.5"
                      disabled={assigningId === order.id || blocked || partners.length === 0}
                      onClick={() => handleAssign(order.id)}
                    >
                      {assigningId === order.id ? "Assigning..." : order.deliveryPartnerId ? "Reassign" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="text-center text-slate-500 py-10 text-sm">
            No orders awaiting assignment.
            <br />
            <span className="text-slate-400">
              Orders appear here once the seller marks them <strong>Ready For Dispatch</strong>.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
