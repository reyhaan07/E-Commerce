import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { apiRequest } from "../../api/client";
import SellerDocuments from "../../components/SellerDocuments";

const VERIFICATION_BADGE = {
  Verified: "bg-green-50 text-green-700",
  Pending: "bg-amber-50 text-amber-700",
  Suspended: "bg-red-50 text-red-700",
};

export default function SellerManagement() {
  const [sellers, setSellers] = useState([]);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [detail, setDetail] = useState(null); // the seller opened for inspection

  function refresh() {
    apiRequest("/admin/accounts?role=seller")
      .then((data) => {
        setSellers(data.accounts);
        // keep an open detail modal showing the fresh record after a status change
        setDetail((open) => (open ? data.accounts.find((s) => s.id === open.id) || null : null));
      })
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
                <button
                  onClick={() => setDetail(seller)}
                  className="font-bold text-lg text-left hover:text-brand-600 transition-colors"
                  title="View store details and verification documents"
                >
                  {seller.name}
                </button>
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
              <button onClick={() => setDetail(seller)} className="text-sm font-semibold text-brand-600 hover:text-brand-800">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-400 text-center py-10">No stores match your search.</p>}

      {/* Seller detail — store profile + the proofs submitted at registration */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-xl">{detail.businessName || detail.name}</h3>
                <p className="text-sm text-slate-500">{detail.email}{detail.phone ? ` · ${detail.phone}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  detail.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>{detail.status}</span>
                <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {detail.storeDescription && <p className="text-sm text-slate-600">{detail.storeDescription}</p>}

              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Store name" value={detail.name} />
                <DetailRow label="Business name" value={detail.businessName} />
                <DetailRow label="GSTIN" value={detail.gstin} mono />
                <DetailRow label="PAN" value={detail.panNumber} mono />
                <DetailRow label="Support email" value={detail.supportEmail} />
                <DetailRow label="Support phone" value={detail.supportPhone} />
                <DetailRow label="Business address" value={detail.businessAddress || detail.addresses?.[0]?.city} />
                <DetailRow label="Rating" value={detail.sellerRating ? `★ ${detail.sellerRating} (${detail.sellerRatingCount})` : "—"} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Verification</div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    VERIFICATION_BADGE[detail.verificationStatus] || "bg-slate-100 text-slate-600"
                  }`}>{detail.verificationStatus || "Not submitted"}</span>
                </div>
                {detail.verificationStatus === "Suspended" && detail.verificationReason && (
                  <p className="text-sm text-rose-600">{detail.verificationReason}</p>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
                  Submitted documents ({detail.documents?.length || 0})
                </div>
                <SellerDocuments documents={detail.documents} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-sm text-slate-700 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}
