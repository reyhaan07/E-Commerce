import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../api/client";

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    apiRequest("/admin/stats").then((d) => setStats(d.stats)).catch(() => {});
    apiRequest("/orders").then((d) => setOrders(d.orders)).catch(() => {});
  }, []);

  const derived = useMemo(() => {
    const active = orders.filter((o) => !["Cancelled", "Returned"].includes(o.sellerStatus));

    const byMonth = {};
    for (const o of active) {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("en", { month: "short" });
      byMonth[key] = byMonth[key] || { name: key, revenue: 0, orders: 0, index: d.getMonth() };
      byMonth[key].revenue += o.amount;
      byMonth[key].orders += 1;
    }
    const months = Object.values(byMonth).sort((a, b) => a.index - b.index);
    const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));

    const bySeller = {};
    for (const o of active) {
      const key = o.sellerName || o.sellerId || "Unknown";
      bySeller[key] = (bySeller[key] || 0) + o.amount;
    }
    const topSellers = Object.entries(bySeller).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxSeller = topSellers[0]?.[1] || 1;

    const prepaid = orders.filter((o) => o.paymentMethod === "Prepaid").length;

    return { months, maxRevenue, topSellers, maxSeller, prepaid };
  }, [orders]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats && [
          { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
          { title: "Orders", value: stats.orders },
          { title: "Prepaid Share", value: `${orders.length ? Math.round((derived.prepaid / orders.length) * 100) : 0}%` },
          { title: "Avg Order Value", value: `₹${stats.orders ? Math.round(stats.revenue / stats.orders).toLocaleString("en-IN") : 0}` },
        ].map((t) => (
          <div key={t.title} className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500 text-sm">{t.title}</h3>
            <p className="text-2xl font-bold mt-2">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold mb-4">Monthly Revenue</h3>
        <div className="flex items-end gap-4 h-48">
          {derived.months.map((m) => (
            <div key={m.name} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">₹{(m.revenue / 1000).toFixed(0)}k</span>
              <div className="w-full bg-blue-600 rounded-t-lg" style={{ height: `${Math.round((m.revenue / derived.maxRevenue) * 100)}%`, minHeight: 6 }} />
              <span className="text-xs text-slate-400">{m.name} ({m.orders})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold mb-4">Revenue by Store</h3>
        <div className="space-y-2">
          {derived.topSellers.map(([name, revenue]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-52 text-sm text-slate-600 truncate">{name}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round((revenue / derived.maxSeller) * 100)}%` }} />
              </div>
              <span className="w-24 text-sm font-bold text-right">₹{revenue.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
