import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest("/admin/stats")
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err.message));
  }, []);

  const tiles = stats ? [
    { title: "Users", value: stats.users },
    { title: "Sellers", value: stats.sellers },
    { title: "Products", value: stats.products },
    { title: "Orders", value: stats.orders },
    { title: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
    { title: "Active Carts", value: stats.activeCarts },
    { title: "Pending Reviews", value: stats.pendingReviews },
    { title: "Open Returns", value: stats.openReturns },
  ] : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {!stats && !error && <p className="text-slate-500">Loading platform stats…</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {tiles.map((item) => (
          <div key={item.title} className="bg-white rounded-xl shadow p-5">
            <h3 className="text-gray-500">{item.title}</h3>
            <p className="text-3xl font-bold mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      {stats && (
        <div className="bg-white rounded-xl shadow p-5 mt-6">
          <h3 className="font-bold mb-4">Orders by Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-40 text-sm text-slate-600">{status}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.round((count / stats.orders) * 100)}%` }} />
                </div>
                <span className="w-8 text-sm font-bold text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
