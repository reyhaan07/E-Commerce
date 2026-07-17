import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";

const BADGE = {
  Verified: "bg-green-50 text-green-700",
  Pending: "bg-amber-50 text-amber-700",
  Suspended: "bg-red-50 text-red-700",
};

export default function SellerVerification() {
  const [sellers, setSellers] = useState([]);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/admin/accounts?role=seller")
      .then((data) => setSellers(data.accounts))
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, []);

  async function setVerification(seller, verificationStatus) {
    try {
      await apiRequest(`/admin/accounts/${seller.id}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus }),
      });
      setFeedback(`${seller.name} marked ${verificationStatus}`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const pending = sellers.filter((s) => s.verificationStatus === "Pending");
  const rest = sellers.filter((s) => s.verificationStatus !== "Pending");

  const table = (rows) => (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Store</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Support Email</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">GSTIN</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Verification</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((seller) => (
            <tr key={seller.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-6 py-4 text-sm font-medium">{seller.name}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{seller.supportEmail || seller.email}</td>
              <td className="px-6 py-4 text-sm"><code className="text-xs">{seller.gstin || "—"}</code></td>
              <td className="px-6 py-4 text-sm text-slate-600">{seller.addresses?.[0]?.city || "—"}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[seller.verificationStatus] || "bg-slate-100 text-slate-600"}`}>
                  {seller.verificationStatus || "—"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-3">
                  {seller.verificationStatus !== "Verified" && (
                    <button onClick={() => setVerification(seller, "Verified")} className="text-sm font-semibold text-green-600 hover:text-green-800">Approve</button>
                  )}
                  {seller.verificationStatus !== "Suspended" && (
                    <button onClick={() => setVerification(seller, "Suspended")} className="text-sm font-semibold text-red-600 hover:text-red-800">Suspend</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Seller Verification</h1>
      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <h2 className="font-bold text-lg">Awaiting Verification ({pending.length})</h2>
      {pending.length ? table(pending) : <p className="text-slate-400">No stores waiting for verification.</p>}

      <h2 className="font-bold text-lg pt-4">All Stores</h2>
      {table(rest)}
    </div>
  );
}
