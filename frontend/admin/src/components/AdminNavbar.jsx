import { Link } from "react-router-dom";
import { FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

// Shared login page runs on its own origin (frontend/login), so leaving
// the admin app after logout is a hard cross-origin redirect.
const SHARED_LOGIN_URL = "http://localhost:5177";

export default function AdminNavbar() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.href = `${SHARED_LOGIN_URL}?role=admin`;
  }

  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h2 className="font-semibold text-xl">
        E-Commerce Admin Panel
      </h2>

      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
        >
          <FaArrowLeft size={14} />
          Back to Store
        </Link>
        <span className="text-slate-600 font-medium">{user?.name || "Admin"}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium transition-colors"
        >
          <FaSignOutAlt size={14} />
          Log Out
        </button>
      </div>
    </div>
  );
}
