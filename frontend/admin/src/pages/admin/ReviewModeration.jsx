import { useEffect, useState } from "react";
import { FaCheck, FaTimes, FaStar } from "react-icons/fa";
import { apiRequest } from "../../api/client";

export default function ReviewModeration() {
  const [pending, setPending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [feedback, setFeedback] = useState("");

  function refresh() {
    apiRequest("/reviews?moderationStatus=Pending")
      .then((data) => setPending(data.reviews))
      .catch((err) => setFeedback(err.message));
    apiRequest("/reviews?moderationStatus=Approved")
      .then((data) => setRecent(data.reviews.slice(0, 10)))
      .catch(() => {});
  }

  useEffect(refresh, []);

  async function decide(review, moderationStatus) {
    try {
      await apiRequest(`/reviews/${review.id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ moderationStatus }),
      });
      setFeedback(`Review of ${review.productName} ${moderationStatus.toLowerCase()} — product & seller ratings recalculated`);
      refresh();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  const stars = (n) => (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }, (_, i) => <FaStar key={i} className={i < n ? "" : "text-slate-200"} />)}
    </span>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Review Moderation</h1>
      <p className="text-sm text-slate-500">Approved reviews publish on the product page and update product & seller rating aggregates.</p>
      {feedback && <p className="text-sm font-medium text-blue-700">{feedback}</p>}

      <h2 className="font-bold text-lg">Pending ({pending.length})</h2>
      <div className="space-y-3">
        {pending.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold">{r.productName}</span>
                {stars(r.rating)}
                <span className="text-xs text-slate-400">{r.userName} · order {r.orderId}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">“{r.comment || "No comment"}”</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => decide(r, "Approved")} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                <FaCheck /> Approve
              </button>
              <button onClick={() => decide(r, "Rejected")} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">
                <FaTimes /> Reject
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-slate-400 text-center py-6">The moderation queue is empty. 🎉</p>}
      </div>

      <h2 className="font-bold text-lg pt-4">Recently Approved</h2>
      <div className="bg-white rounded-xl shadow divide-y divide-slate-100">
        {recent.map((r) => (
          <div key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{r.productName}</span>
            {stars(r.rating)}
            <span className="text-xs text-slate-400">{r.userName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
