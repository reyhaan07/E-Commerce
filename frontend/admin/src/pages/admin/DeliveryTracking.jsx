import { useEffect, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import StatusBadge from "../../components/StatusBadge";
import { getOrders } from "../../api/orders";

export default function DeliveryTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadOrders() {
    setLoading(true);
    getOrders()
      .then((data) => setOrders(data.filter((o) => o.deliveryPartnerId)))
      .finally(() => setLoading(false));
  }

  useEffect(loadOrders, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Tracking</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors" onClick={loadOrders}>
          <FaSyncAlt size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Currently In Progress</p>
          <p className="text-3xl font-bold mt-2">{orders.filter((o) => o.deliveryStatus !== "Delivered").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Delivered</p>
          <p className="text-3xl font-bold mt-2">{orders.filter((o) => o.deliveryStatus === "Delivered").length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-slate-600">Total Assigned</p>
          <p className="text-3xl font-bold mt-2">{orders.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Delivery Partner</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium">{order.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.customerName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{order.deliveryPartnerName}</td>
                <td className="px-6 py-4"><StatusBadge status={order.deliveryStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <p className="text-center text-slate-500 py-10 text-sm">No orders have been assigned to a delivery partner yet.</p>
        )}
      </div>
    </div>
  );
}
