/**
 * ShopSphere — Login.jsx  (Phase 1)
 *
 * Drop-in replacement for  src/pages/Login.jsx
 *
 * Design system tokens used:
 *   Colors   : brand-*, sky-accent, surface, ink  (tailwind.config.js)
 *   Typography: font-display (Poppins), font-body (Inter)
 *   Shadows  : shadow-soft, shadow-card, shadow-glass, shadow-lift
 *   Utilities: .glass, .btn-primary, .input-field, .card  (index.css)
 *   Animations: animate-slide-up, animate-fade-in             (index.css)
 *
 * Functional surface only — no backend, no routing, no JWT.
 * console.log({ email, password, selectedRole }) on submit.
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaStore,
  FaShieldAlt,
  FaTruck,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

// This login page is the single shared entry point for all 4 ShopSphere
// frontends. Each app runs on its own Vite dev-server port (its own origin),
// so a role picked here that isn't "admin" can't just call this app's own
// useAuth() — it has to hard-redirect to that app's origin and hand off the
// login result via query params (consumed by that app's own useAuth hook).
const APP_ORIGINS = {
  user: "http://localhost:5175",
  seller: "http://localhost:5174",
  admin: "http://localhost:5173",
  delivery: "http://localhost:5176",
};

const DEFAULT_PATH = {
  user: "/",
  seller: "/seller/dashboard",
  admin: "/admin/dashboard",
  delivery: "/delivery/dashboard",
};

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "user",
    label: "User",
    subtitle: "Shop & track orders",
    Icon: FaUser,
    // Accent colours intentionally differentiated so each card reads instantly
    activeRing: "ring-brand-500",
    activeBg: "bg-brand-50",
    activeIcon: "text-brand-600",
    activeBadge: "bg-brand-600",
    activeLabel: "text-brand-700",
  },
  {
    id: "seller",
    label: "Seller",
    subtitle: "Manage your store",
    Icon: FaStore,
    activeRing: "ring-amber-400",
    activeBg: "bg-amber-50",
    activeIcon: "text-amber-600",
    activeBadge: "bg-amber-500",
    activeLabel: "text-amber-700",
  },
  {
    id: "admin",
    label: "Admin",
    subtitle: "Platform control",
    Icon: FaShieldAlt,
    activeRing: "ring-rose-400",
    activeBg: "bg-rose-50",
    activeIcon: "text-rose-600",
    activeBadge: "bg-rose-500",
    activeLabel: "text-rose-700",
  },
  {
    id: "delivery",
    label: "Delivery Partner",
    subtitle: "Deliver orders",
    Icon: FaTruck,
    activeRing: "ring-emerald-400",
    activeBg: "bg-emerald-50",
    activeIcon: "text-emerald-600",
    activeBadge: "bg-emerald-500",
    activeLabel: "text-emerald-700",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * RoleCard
 * Renders one role option as a selectable card.
 * Selected state is conveyed via ring, background tint, and a check badge.
 */
function RoleCard({ role, isSelected, onSelect }) {
  const { id, label, subtitle, Icon } = role;

  // Derive classes conditionally so Tailwind's JIT scanner can pick them up
  const ringClass = isSelected ? role.activeRing : "ring-slate-200";
  const bgClass = isSelected ? role.activeBg : "bg-white";
  const iconClass = isSelected ? role.activeIcon : "text-slate-400";
  const badgeClass = isSelected ? role.activeBadge : "bg-slate-300";
  const labelClass = isSelected ? role.activeLabel : "text-slate-700";

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={isSelected}
      className={`
        relative flex flex-1 flex-col items-center gap-2 rounded-2xl border-0 p-4
        ring-2 transition-all duration-200 cursor-pointer
        hover:shadow-card hover:-translate-y-0.5 active:scale-[0.97]
        ${bgClass} ${ringClass}
      `}
    >
      {/* Selected check badge */}
      <span
        className={`
          absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center
          rounded-full text-[10px] text-white shadow-soft transition-all duration-200
          ${isSelected ? `${badgeClass} opacity-100 scale-100` : "opacity-0 scale-0"}
        `}
        aria-hidden
      >
        ✓
      </span>

      {/* Icon circle */}
      <span
        className={`
          flex h-10 w-10 items-center justify-center rounded-xl
          transition-colors duration-200
          ${isSelected ? role.activeBg : "bg-slate-100"}
        `}
      >
        <Icon className={`text-base transition-colors duration-200 ${iconClass}`} />
      </span>

      <span className={`text-sm font-semibold transition-colors duration-200 ${labelClass}`}>
        {label}
      </span>
      <span className="text-[11px] text-slate-400 text-center leading-tight">
        {subtitle}
      </span>
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: adminUser, login: adminLogin } = useAuth();

  // ── Form state ─────────────────────────────────────────────────────────────
  const requestedRole = searchParams.get("role");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(
    APP_ORIGINS[requestedRole] ? requestedRole : "user"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // If you're already signed in as Admin and just land on /login directly
  // (not sent here by another app asking you to switch roles), skip straight
  // to the dashboard instead of making you log in again.
  useEffect(() => {
    if (!requestedRole && adminUser) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, []);

  const handleLogin = async () => {
    if (!selectedRole) {
      alert("Please select a role.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Invalid email or password");
        return;
      }

      const redirectParam = searchParams.get("redirect");

      // Admin runs in this same app/origin — log in directly, no handoff needed.
      if (selectedRole === "admin") {
        adminLogin({ id: result.id, name: result.name, email });
        const target =
          redirectParam && redirectParam.startsWith(APP_ORIGINS.admin)
            ? redirectParam.replace(APP_ORIGINS.admin, "")
            : DEFAULT_PATH.admin;
        navigate(target, { replace: true });
        return;
      }

      // Every other role lives on a different dev-server origin, so hand off
      // the login result via query params for that app's own useAuth to pick up.
      const origin = APP_ORIGINS[selectedRole];
      let target = origin + DEFAULT_PATH[selectedRole];
      if (redirectParam) {
        try {
          if (new URL(redirectParam).origin === origin) target = redirectParam;
        } catch {
          // ignore malformed redirect param, fall back to the default path
        }
      }

      const url = new URL(target);
      url.searchParams.set("authId", result.id);
      url.searchParams.set("authName", result.name);
      url.searchParams.set("authEmail", email);
      url.searchParams.set("authRole", selectedRole);
      if (result.token) url.searchParams.set("authToken", result.token);
      window.location.href = url.toString();
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const activeRole = ROLES.find((r) => r.id === selectedRole);

  return (
    /*
     * Full-viewport centred layout with the same gradient background used
     * across the project's auth pages (Login, Register).
     */
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-12">

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md animate-slide-up rounded-3xl border border-white/50 bg-white/70 p-8 shadow-glass backdrop-blur-xl sm:p-10">

        {/* ── Branding header ───────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {/* Logo mark — matches Navbar & Register exactly */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-accent text-xl font-bold text-white shadow-soft">
            S
          </div>

          {/* Brand name */}
          <p className="font-display text-lg font-bold text-ink tracking-tight">
            Shop<span className="text-brand-600">Sphere</span>
          </p>

          {/* Welcome copy */}
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to continue your experience
          </p>
        </div>

        {/* ── Role selector ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Login as
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROLES.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                isSelected={selectedRole === role.id}
                onSelect={setSelectedRole}
              />
            ))}
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        {/*
         * onSubmit is intentionally avoided per FUNCTIONAL REQUIREMENTS.
         * The Login button calls handleLogin directly via onClick.
         */}
        <div className="flex flex-col gap-4">

          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11 pr-11"
              />
              {/* Show / Hide toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => console.log("Forgot password — placeholder")}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* ── Login CTA ───────────────────────────────────────────────────── */}
          {/*
           * Uses .btn-primary from index.css for exact visual consistency.
           * The role-tinted gradient overlay adds a subtle contextual accent
           * without deviating from the existing button shape/shadow system.
           */}
          <button
            type="button"
            onClick={handleLogin}
            className="btn-primary mt-2 w-full relative overflow-hidden"
          >
            {/* Subtle inner gradient tint per active role */}
            <span
              className={`
                pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-300
                ${activeRole?.id === "seller"   ? "bg-amber-400"   : ""}
                ${activeRole?.id === "admin"    ? "bg-rose-400"    : ""}
                ${activeRole?.id === "delivery" ? "bg-emerald-400" : ""}
              `}
              aria-hidden
            />
            <span className="relative">
              Login as {activeRole?.label}
            </span>
          </button>
        </div>

        {/* ── Footer links ──────────────────────────────────────────────────── */}
        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
