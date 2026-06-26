import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBars,
  FaTimes,
  FaHome,
  FaThList,
  FaBoxOpen,
} from "react-icons/fa";
import SearchBar from "./SearchBar";
import { useShop } from "../context/ShopContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-brand-600 ${
      isActive ? "text-brand-600" : "text-slate-600"
    }`;

  return (
    <>
      {/* Top utility bar */}
      <div className="hidden bg-gradient-to-r from-brand-800 to-brand-700 sm:block shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-sm">
          <span className="font-semibold text-brand-100">✓ Free delivery on orders above ₹499</span>
          <div className="flex gap-6">
            <Link to="/orders" className="text-brand-100 hover:text-white font-medium transition-colors">Track Order</Link>
            <Link to="/profile" className="text-brand-100 hover:text-white font-medium transition-colors">Help Center</Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-soft backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <button
            className="text-ink lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-sky-accent text-lg font-bold text-white shadow-soft">
              S
            </div>
            <span className="font-display text-xl font-bold text-ink hidden sm:inline">
              Shop<span className="text-brand-600">Sphere</span>
            </span>
          </Link>

          <div className="hidden flex-1 md:block">
            <SearchBar />
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
        <NavLink to="/" className={navLinkClass}>Home</NavLink>

          <NavLink to="/products" className={navLinkClass}>
              Shop
            </NavLink>

          <NavLink to="/orders" className={navLinkClass}>
             Orders
            </NavLink>

          <NavLink
              to="/admin/dashboard"
                className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
      >
    Admin Panel
  </NavLink>
</nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/profile"
              className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 sm:flex hover:bg-brand-100"
            >
              <FaUser size={15} />
            </Link>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary hidden sm:inline-flex !px-4 !py-2 text-sm"
            >
              Login
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 md:hidden">
          <SearchBar />
        </div>

        {/* Mobile drawer menu */}
        {menuOpen && (
          <div className="absolute left-0 top-full w-full animate-slide-up border-t border-slate-100 bg-white px-4 py-4 shadow-card lg:hidden">
            <nav className="flex flex-col gap-3">
              <NavLink to="/" onClick={() => setMenuOpen(false)} className={navLinkClass}>Home</NavLink>
              <NavLink to="/products" onClick={() => setMenuOpen(false)} className={navLinkClass}>Shop</NavLink>
              <NavLink to="/orders" onClick={() => setMenuOpen(false)} className={navLinkClass}>Orders</NavLink>
              <NavLink
  to="/admin/dashboard"
  onClick={() => setMenuOpen(false)}
  className={navLinkClass}
>
  Admin Panel
</NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={navLinkClass}>Profile</NavLink>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary mt-2 text-center text-sm">
                Login
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-between border-t border-slate-100 bg-white/95 px-2 py-2 shadow-lift backdrop-blur sm:hidden">
        {[
          { to: "/", icon: <FaHome />, label: "Home" },
          { to: "/products", icon: <FaThList />, label: "Shop" },
          { to: "/orders", icon: <FaBoxOpen />, label: "Orders" },
          {
  to: "/admin/dashboard",
  icon: <FaUser />,
  label: "Admin"
},
          { to: "/profile", icon: <FaUser />, label: "Profile" },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-medium ${
                isActive ? "text-brand-600" : "text-slate-400"
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
