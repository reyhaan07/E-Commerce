import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import { apiRequest } from "../api/client";

const SOCKET_URL = "http://localhost:5000";

// Admin notification center: seeded feed from /api/notifications plus live
// Socket.io pushes (new users, orders, cancellations, returns, reviews).
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef(null);

  function refresh() {
    apiRequest("/notifications?limit=25")
      .then((data) => { setItems(data.notifications); setUnread(data.unread); })
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
    const socket = io(SOCKET_URL, { query: { role: "admin" } });
    socket.on("notification", (n) => {
      setItems((current) => [n, ...current].slice(0, 25));
      setUnread((u) => u + 1);
    });
    socket.on("cart-activity", () => {}); // dashboard listens separately
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    try {
      await apiRequest("/notifications/read-all", { method: "PATCH" });
      setUnread(0);
      refresh();
    } catch (e) { /* non-fatal */ }
  }

  return (
    <div ref={rootRef} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
        <FaBell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] w-4.5 h-4.5 min-w-4 px-1 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-bold text-sm">Notifications</span>
            <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 hover:underline">Mark all read</button>
          </div>
          {items.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-slate-50 ${n.read ? "" : "bg-blue-50/50"}`}>
              <p className="text-sm font-semibold">{n.title}</p>
              {n.message && <p className="text-xs text-slate-500">{n.message}</p>}
              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</p>}
        </div>
      )}
    </div>
  );
}
