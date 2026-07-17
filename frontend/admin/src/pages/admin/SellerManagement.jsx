import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

export default function SellerManagement() {
  const [sellers, setSellers] = useState([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/admin/accounts?role=seller")
      .then((data) => setSellers(data.accounts))
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, []);

  async function toggleStatus(seller) {
    const status = seller.status === "active" ? "suspended" : "active";
    try {
      await apiRequest(`/admin/accounts/${seller.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setFeedback(`${seller.name} is now ${status}`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const filtered = sellers.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Seller Management</h1>
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 w-72"
          placeholder="Search stores…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((seller) => (
          <div key={seller.id} className="bg-white rounded-xl shadow p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg">{seller.name}</h3>
                <p className="text-sm text-slate-500">{seller.email} · {seller.addresses?.[0]?.city || "—"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                seller.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>{seller.status}</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">{seller.storeDescription}</p>
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-slate-500">GSTIN: <code className="text-xs">{seller.gstin || "—"}</code></span>
              <span className="font-semibold text-amber-600">★ {seller.sellerRating || "—"} ({seller.sellerRatingCount})</span>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => toggleStatus(seller)}
                className={`text-sm font-semibold ${seller.status === "active" ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
              >
                {seller.status === "active" ? "Suspend Store" : "Reactivate Store"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-400 text-center py-10">No stores match your search.</p>}
    </div>
  );
}
