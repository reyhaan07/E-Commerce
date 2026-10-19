import React from "react";
import { FaStore, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import NotificationBell from "./NotificationBell";

const SHARED_LOGIN_URL = "http://localhost:5177";
const STOREFRONT_URL = "http://localhost:5175";

export default function AdminNavbar() {
  const { user, isSuperAdmin, logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.href = `${SHARED_LOGIN_URL}?role=admin`;
  }

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
          Operations & Control
        </h2>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {isSuperAdmin ? "Super Admin" : "Staff Admin"}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <a
          href={STOREFRONT_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
        >
          <FaStore size={13} className="text-blue-600" />
          Live Storefront
        </a>

        <NotificationBell />

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {(user?.name || "A").slice(0, 1).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-slate-800 hidden sm:inline">
            {user?.name || "Admin"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
        >
          <FaSignOutAlt size={12} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
}
