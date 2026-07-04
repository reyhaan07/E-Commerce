import { useEffect, useState } from "react";
import { FaTruck, FaCheckCircle, FaClock, FaUsers } from "react-icons/fa";
import { getOrders } from "../../api/orders";
import { getDeliveryPartners } from "../../api/deliveryPartners";

const DELIVERY_STATUSES = ["Assigned", "Accepted", "Picked Up", "In Transit", "Out For Delivery", "Delivered"];

export default function DeliveryAnalytics() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getDeliveryPartners()])
      .then(([ordersData, partnersData]) => {
        setOrders(ordersData);
        setPartners(partnersData);
      })
      .finally(() => setLoading(false));
  }, []);

  const assignedOrders = orders.filter((o) => o.deliveryPartnerId);
  const delivered = assignedOrders.filter((o) => o.deliveryStatus === "Delivered");
  const inProgress = assignedOrders.filter((o) => o.deliveryStatus !== "Delivered");

  const statusCounts = DELIVERY_STATUSES.map((status) => ({
    status,
    count: assignedOrders.filter((o) => o.deliveryStatus === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count));

  const partnerLoad = partners.map((p) => ({
    name: p.name,
    total: assignedOrders.filter((o) => o.deliveryPartnerId === p.id).length,
    delivered: assignedOrders.filter((o) => o.deliveryPartnerId === p.id && o.deliveryStatus === "Delivered").length,
  }));
  const maxPartnerLoad = Math.max(1, ...partnerLoad.map((p) => p.total));

  if (loading) {
    return <p className="text-slate-500">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Delivery Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Assigned</p>
              <p className="text-3xl font-bold mt-2">{assignedOrders.length}</p>
            </div>
            <FaTruck className="text-4xl text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Delivered</p>
              <p className="text-3xl font-bold mt-2">{delivered.length}</p>
            </div>
            <FaCheckCircle className="text-4xl text-green-600 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-3xl font-bold mt-2">{inProgress.length}</p>
            </div>
            <FaClock className="text-4xl text-yellow-600 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Partners</p>
              <p className="text-3xl font-bold mt-2">{partners.length}</p>
            </div>
            <FaUsers className="text-4xl text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Orders By Delivery Status</h3>
          <div className="space-y-4">
            {statusCounts.map((s) => (
              <div key={s.status}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{s.status}</span>
                  <span className="text-sm text-slate-600">{s.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(s.count / maxStatusCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Deliveries By Partner</h3>
          {partnerLoad.length === 0 ? (
            <p className="text-sm text-slate-500">No delivery partners yet.</p>
          ) : (
            <div className="space-y-4">
              {partnerLoad.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm text-slate-600">{p.delivered}/{p.total} delivered</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full" style={{ width: `${(p.total / maxPartnerLoad) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
