import { useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { apiRequest } from "../../api/client";

export default function ProductApproval() {
  const [products, setProducts] = useState([]);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/products?approvalStatus=Pending&limit=48")
      .then((data) => setProducts(data.products))
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, []);

  async function decide(product, approvalStatus) {
    try {
      await apiRequest(`/products/${product.id}/approval`, {
        method: "PATCH",
        body: JSON.stringify({ approvalStatus }),
      });
      setFeedback(`${product.name} ${approvalStatus.toLowerCase()}`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Approval</h1>
      <p className="text-sm text-slate-500">{products.length} products waiting for review. Approved products go live in the storefront; rejected ones never appear.</p>
      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-5 flex gap-4">
            <img src={p.images?.[0]} alt="" className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{p.name}</h3>
              <p className="text-xs text-slate-500">{p.category} → {p.subcategory} → {p.productType}</p>
              <p className="text-xs text-slate-500">Seller {p.sellerId} · ₹{p.price} · stock {p.stock}</p>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.description}</p>
              <div className="flex gap-3 mt-3">
                <button onClick={() => decide(p, "Approved")} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                  <FaCheck /> Approve
                </button>
                <button onClick={() => decide(p, "Rejected")} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && <p className="text-slate-400 text-center py-10">The approval queue is empty. 🎉</p>}
    </div>
  );
}
