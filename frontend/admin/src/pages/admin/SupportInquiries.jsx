import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { FaCheckCircle, FaInbox, FaUser, FaStore } from "react-icons/fa";

export default function SupportInquiries() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState("");

  function loadRequests() {
    setLoading(true);
    apiRequest("/support")
      .then((data) => setRequests(data.requests || []))
      .catch((err) => setFeedback(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateStatus(id, newStatus) {
    setUpdatingId(id);
    try {
      await apiRequest(`/support/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setFeedback(`Ticket ${id} marked as ${newStatus}`);
      loadRequests();
    } catch (err) {
      setFeedback(err.message || "Could not update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = requests.filter((r) => {
    if (filterStatus === "All") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display">Support Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">Direct communication from Customers and Sellers</p>
        </div>

        <div className="flex items-center gap-2">
          {["All", "Open", "Resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterStatus === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st} ({st === "All" ? requests.length : requests.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-3 text-sm font-semibold rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading support inquiries…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <FaInbox className="mx-auto text-4xl mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">No support requests found</p>
          <p className="text-sm">Inquiries from customers and sellers will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const isUser = item.requesterRole === "user";
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isUser ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {isUser ? <FaUser size={10} /> : <FaStore size={10} />}
                        {isUser ? "User / Customer" : "Seller"}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{item.subject}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      From: <span className="font-semibold text-slate-700">{item.requesterName}</span> ({item.requesterEmail || item.requesterId})
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === "Open"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      onClick={() => updateStatus(item.id, item.status === "Open" ? "Resolved" : "Open")}
                      disabled={updatingId === item.id}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        item.status === "Open"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {updatingId === item.id ? "…" : item.status === "Open" ? "Mark Resolved" : "Reopen"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                  {item.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
