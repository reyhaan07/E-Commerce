import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { apiRequest } from "../../api/client";

const BADGE = {
  Approved: "bg-green-50 text-green-700",
  Pending: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (query.trim()) params.set("q", query.trim());
    apiRequest(`/products?${params.toString()}`)
      .then((data) => { setProducts(data.products); setPagination(data.pagination); })
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, [page, query]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(product) {
    if (!window.confirm(`Delete ${product.name} from the catalog?`)) return;
    try {
      await apiRequest(`/products/${product.id}`, { method: "DELETE" });
      setFeedback(`${product.name} deleted`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <input
          className="border border-slate-200 rounded-lg px-4 py-2 w-72"
          placeholder="Search the catalog…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
      </div>

      <p className="text-sm text-slate-500">{pagination.total} products in the catalog (all sellers, all statuses)</p>
      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Placement</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Seller</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.id} · {p.sku} · ★{p.rating || "—"}</p>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.category}{p.productType ? ` → ${p.productType}` : ""}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{p.sellerId}</td>
                <td className="px-6 py-4 text-sm font-semibold">₹{p.price}</td>
                <td className="px-6 py-4 text-sm">{p.stock}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[p.approvalStatus]}`}>{p.approvalStatus}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => remove(p)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400">No products match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-lg text-sm font-bold ${n === pagination.page ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
