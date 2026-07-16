import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaStore,
  FaShieldAlt,
  FaTruck,
} from 'react-icons/fa'
import './styles.css'

const API_BASE = 'http://localhost:5000/api'
const REGISTER_URL = 'http://localhost:5175/register'

// This standalone app is the single shared login page for all 4 ShopSphere
// frontends. Each app runs on its own Vite dev-server port (its own origin),
// so localStorage can't be shared — after a successful login we hard-redirect
// to the chosen role's app and hand off the result via query params, which
// that app's own useAuth hook consumes.
const APP_ORIGINS = {
  user: 'http://localhost:5175',
  seller: 'http://localhost:5174',
  admin: 'http://localhost:5173',
  delivery: 'http://localhost:5176',
}

const DEFAULT_PATH = {
  user: '/',
  seller: '/seller/dashboard',
  admin: '/admin/dashboard',
  delivery: '/',
}

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLES = [
  {
    id: 'user',
    label: 'User',
    subtitle: 'Shop & track orders',
    Icon: FaUser,
    activeRing: 'ring-brand-500',
    activeBg: 'bg-brand-50',
    activeIcon: 'text-brand-600',
    activeBadge: 'bg-brand-600',
    activeLabel: 'text-brand-700',
  },
  {
    id: 'seller',
    label: 'Seller',
    subtitle: 'Manage your store',
    Icon: FaStore,
    activeRing: 'ring-brand-500',
    activeBg: 'bg-brand-50',
    activeIcon: 'text-brand-600',
    activeBadge: 'bg-brand-600',
    activeLabel: 'text-brand-700',
  },
  {
    id: 'admin',
    label: 'Admin',
    subtitle: 'Platform control',
    Icon: FaShieldAlt,
    activeRing: 'ring-brand-500',
    activeBg: 'bg-brand-50',
    activeIcon: 'text-brand-600',
    activeBadge: 'bg-brand-600',
    activeLabel: 'text-brand-700',
  },
  {
    id: 'delivery',
    label: 'Delivery Partner',
    subtitle: 'Deliver orders',
    Icon: FaTruck,
    activeRing: 'ring-brand-500',
    activeBg: 'bg-brand-50',
    activeIcon: 'text-brand-600',
    activeBadge: 'bg-brand-600',
    activeLabel: 'text-brand-700',
  },
]

function getInitialRole() {
  const role = new URLSearchParams(window.location.search).get('role')
  return APP_ORIGINS[role] ? role : 'user'
}

// Only honour a ?redirect= that points back into the chosen role's own app,
// so a tampered link can't bounce the login result to some other origin.
function safeRedirectForRole(role) {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  const fallback = APP_ORIGINS[role] + DEFAULT_PATH[role]

  if (!redirect) return fallback
  try {
    const url = new URL(redirect)
    return url.origin === APP_ORIGINS[role] ? redirect : fallback
  } catch {
    return fallback
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * RoleCard
 * Renders one role option as a selectable card.
 * Selected state is conveyed via ring, background tint, and a check badge.
 */
function RoleCard({ role, isSelected, onSelect }) {
  const { id, label, subtitle, Icon } = role

  // Derive classes conditionally so Tailwind's JIT scanner can pick them up
  const ringClass = isSelected ? role.activeRing : 'ring-slate-200'
  const bgClass = isSelected ? role.activeBg : 'bg-white'
  const iconClass = isSelected ? role.activeIcon : 'text-slate-400'
  const badgeClass = isSelected ? role.activeBadge : 'bg-slate-300'
  const labelClass = isSelected ? role.activeLabel : 'text-slate-700'

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={isSelected}
      className={`
        relative flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border-0 px-4 py-5
        ring-2 transition-all duration-200 cursor-pointer
        hover:shadow-card hover:-translate-y-0.5 active:scale-[0.97]
        ${bgClass} ${ringClass}
      `}
    >
      {/* Selected check badge */}
      <span
        className={`
          absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center
          rounded-full text-[10px] text-white shadow-soft transition-all duration-200
          ${isSelected ? `${badgeClass} opacity-100 scale-100` : 'opacity-0 scale-0'}
        `}
        aria-hidden
      >
        ✓
      </span>

      {/* Icon circle */}
      <span
        className={`
          flex h-11 w-11 items-center justify-center rounded-2xl
          transition-colors duration-200
          ${isSelected ? 'bg-brand-50' : 'bg-slate-100'}
        `}
      >
        <Icon className={`text-lg transition-colors duration-200 ${iconClass}`} />
      </span>

      <span className={`text-sm font-bold transition-colors duration-200 ${labelClass}`}>
        {label}
      </span>
      <span className="text-xs font-medium text-slate-400 text-center leading-tight">
        {subtitle}
      </span>
    </button>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

function App() {
  const params = new URLSearchParams(window.location.search)
  const [selectedRole, setSelectedRole] = useState(getInitialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState(params.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [mode, setMode] = useState(params.get('token') ? 'reset' : 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: selectedRole }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Invalid email or password')
      }

      // Hand off the login result to the chosen role's own app/origin.
      const target = new URL(safeRedirectForRole(selectedRole))
      target.searchParams.set('authId', result.id)
      target.searchParams.set('authName', result.name)
      target.searchParams.set('authEmail', result.email || email)
      target.searchParams.set('authRole', result.role || selectedRole)
      if (result.token) target.searchParams.set('authToken', result.token)
      window.location.href = target.toString()
    } catch (err) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not request reset')
      }

      setNotice(`${result.message}. Check the backend console for the mock reset token.`)
      setMode('reset')
    } catch (err) {
      setError(err.message || 'Could not request reset')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not reset password')
      }

      setNotice('Password reset. You can sign in with the new password now.')
      setPassword('')
      setNewPassword('')
      setMode('login')
    } catch (err) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  const activeRole = ROLES.find((r) => r.id === selectedRole)

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f6faff] px-4 py-8 sm:py-10">

      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[448px] animate-slide-up rounded-[28px] bg-white px-10 py-10 shadow-[0_24px_70px_rgba(30,58,138,0.12)]">

        {/* ── Branding header ───────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-accent text-xl font-bold text-white shadow-soft">
            S
          </div>

          <p className="font-display text-lg font-extrabold text-ink tracking-tight">
            Shop<span className="text-brand-600">Sphere</span>
          </p>

          <h1 className="mt-2 font-display text-[26px] font-extrabold leading-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Sign in to continue your experience
          </p>
        </div>

        {/* ── Role selector ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Login as
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {notice}
          </div>
        )}

        {mode === 'forgot' && (
          <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-ink">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-11" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
              {loading ? 'Sending...' : 'Send Reset Token'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Back to login
            </button>
          </form>
        )}

        {mode === 'reset' && (
          <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
            {error && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="reset-token" className="mb-1.5 block text-sm font-medium text-ink">
                Reset Token
              </label>
              <input id="reset-token" type="text" placeholder="Token from backend console" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required className="input-field" />
            </div>
            <div>
              <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-ink">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input id="reset-password" type={showPassword ? 'text' : 'password'} minLength="8" autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="input-field pl-11 pr-11" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Back to login
            </button>
          </form>
        )}

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        {mode === 'login' && <form className="flex flex-col gap-4" onSubmit={handleLogin}>

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
                required
                className="input-field pl-11"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pl-11 pr-11"
              />
              {/* Show / Hide toggle */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 select-none">
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
              onClick={() => { setMode('forgot'); setError(''); setNotice('') }}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* ── Login CTA ───────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full"
          >
            {loading ? 'Logging in...' : `Login as ${activeRole?.label}`}
          </button>
        </form>}

        {/* ── Footer links ──────────────────────────────────────────────────── */}
        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <a
            href={REGISTER_URL}
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
