import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaFileAlt, FaStore, FaExternalLinkAlt } from "react-icons/fa";
import { apiRequest } from "../../api/client";

const BADGE = {
  Verified: "bg-green-50 text-green-700",
  Pending: "bg-amber-50 text-amber-700",
  Suspended: "bg-red-50 text-red-700",
};

const DOC_LABELS = { gst: "GST Certificate", pan: "PAN Card", cheque: "Cancelled Cheque", id: "Government ID" };

export default function SellerVerification() {
  const [sellers, setSellers] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [preview, setPreview] = useState(null); // { label, dataUrl }
  const [rejectTarget, setRejectTarget] = useState(null); // seller
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    apiRequest("/admin/accounts?role=seller")
      .then((data) => setSellers(data.accounts))
      .catch((err) => setFeedback(err.message));
  }

  useEffect(refresh, []);

  async function setVerification(seller, verificationStatus, reason) {
    setBusyId(seller.id);
    try {
      await apiRequest(`/admin/accounts/${seller.id}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus, reason }),
      });
      setFeedback(
        verificationStatus === "Verified"
          ? `${seller.name} approved — the seller has been notified`
          : `${seller.name} rejected — the seller has been notified`
      );
      setRejectTarget(null);
      setRejectReason("");
      refresh();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pending = sellers.filter((s) => s.verificationStatus === "Pending");
  const rest = sellers.filter((s) => s.verificationStatus !== "Pending");

  const DetailRow = ({ label, value, mono }) => (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-sm text-slate-700 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );

  function DocThumb({ doc }) {
    const isPdf = typeof doc.dataUrl === "string" && doc.dataUrl.startsWith("data:application/pdf");
    return (
      <button
        onClick={() => setPreview({ label: doc.label || DOC_LABELS[doc.type] || doc.type, dataUrl: doc.dataUrl, isPdf })}
        className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-slate-200 hover:border-brand-400 hover:shadow-soft transition-all bg-slate-50 w-[104px]"
        title={`Preview ${doc.label || doc.type}`}
      >
        {isPdf ? (
          <div className="w-full h-16 rounded-md bg-white flex items-center justify-center text-brand-500"><FaFileAlt size={22} /></div>
        ) : (
          <img src={doc.dataUrl} alt={doc.type} className="w-full h-16 rounded-md object-cover bg-white" />
        )}
        <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">{DOC_LABELS[doc.type] || doc.label || doc.type}</span>
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Seller Verification</h1>
      {feedback && <p className="text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{feedback}</p>}

      {/* Pending applications — full detail + documents */}
      <div>
        <h2 className="font-bold text-lg mb-3">Awaiting Verification ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-slate-400">No stores waiting for verification.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((seller) => (
              <div key={seller.id} className="rounded-xl border border-slate-200 bg-white shadow-soft p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                      {seller.avatar ? <img src={seller.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : <FaStore />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{seller.businessName || seller.name}</div>
                      <div className="text-sm text-slate-500">{seller.email}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[seller.verificationStatus]}`}>{seller.verificationStatus}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  <DetailRow label="Store Name" value={seller.name} />
                  <DetailRow label="GSTIN" value={seller.gstin} mono />
                  <DetailRow label="PAN" value={seller.panNumber} mono />
                  <DetailRow label="Support Phone" value={seller.supportPhone || seller.phone} />
                  <DetailRow label="City" value={seller.addresses?.[0]?.city} />
                  <DetailRow label="Business Address" value={seller.businessAddress} />
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-2">
                    Documents ({seller.documents?.length || 0})
                  </div>
                  {seller.documents?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {seller.documents.map((doc, i) => <DocThumb key={i} doc={doc} />)}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No documents were submitted with this application.</p>
                  )}
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setVerification(seller, "Verified")}
                    disabled={busyId === seller.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <FaCheck size={12} /> Approve
                  </button>
                  <button
                    onClick={() => { setRejectTarget(seller); setRejectReason(""); }}
                    disabled={busyId === seller.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <FaTimes size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already-decided stores */}
      <div>
        <h2 className="font-bold text-lg mb-3">All Stores</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Store</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">GSTIN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">PAN</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Verification</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((seller) => (
                <tr key={seller.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium">{seller.name}</td>
                  <td className="px-6 py-4 text-sm"><code className="text-xs">{seller.gstin || "—"}</code></td>
                  <td className="px-6 py-4 text-sm"><code className="text-xs">{seller.panNumber || "—"}</code></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{seller.addresses?.[0]?.city || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${BADGE[seller.verificationStatus] || "bg-slate-100 text-slate-600"}`}>
                      {seller.verificationStatus || "—"}
                    </span>
                    {seller.verificationStatus === "Suspended" && seller.verificationReason && (
                      <div className="text-[11px] text-slate-400 mt-1 max-w-[220px]">{seller.verificationReason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {seller.verificationStatus !== "Verified" && (
                        <button onClick={() => setVerification(seller, "Verified")} className="text-sm font-semibold text-green-600 hover:text-green-800">Approve</button>
                      )}
                      {seller.verificationStatus !== "Suspended" && (
                        <button onClick={() => { setRejectTarget(seller); setRejectReason(""); }} className="text-sm font-semibold text-red-600 hover:text-red-800">Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="font-bold">{preview.label}</h3>
              <div className="flex items-center gap-3">
                <a href={preview.dataUrl} download className="text-brand-600 hover:text-brand-800 text-sm flex items-center gap-1.5"><FaExternalLinkAlt size={12} /> Download</a>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
              </div>
            </div>
            <div className="p-4">
              {preview.isPdf
                ? <iframe title="doc" src={preview.dataUrl} className="w-full h-[65vh] rounded-lg border border-slate-200" />
                : <img src={preview.dataUrl} alt={preview.label} className="w-full rounded-lg" />}
            </div>
          </div>
        </div>
      )}

      {/* Reject-with-reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Reject {rejectTarget.businessName || rejectTarget.name}?</h3>
            <p className="text-sm text-slate-500 mt-1">The seller will be notified. Add an optional reason so they know what to fix.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. GST certificate is unreadable — please re-upload a clearer copy"
              className="input-field mt-3"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setRejectTarget(null)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Cancel</button>
              <button onClick={() => setVerification(rejectTarget, "Suspended", rejectReason)} disabled={busyId === rejectTarget.id}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-50">
                {busyId === rejectTarget.id ? "Rejecting…" : "Reject application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
