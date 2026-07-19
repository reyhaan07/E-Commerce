import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaUser, FaStore, FaShieldAlt, FaTruck, FaArrowLeft, FaArrowRight,
} from 'react-icons/fa'
import './styles.css'

const API_BASE = 'http://localhost:5000/api'
const USER_REGISTER_URL = 'http://localhost:5175/register'
const SELLER_REGISTER_URL = 'http://localhost:5174/seller/register'

// This standalone app is the shared login entry for all 4 ShopSphere
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

// Per-role branding + copy for the dedicated login screens.
const ROLE_META = {
  user: {
    label: 'User', Icon: FaUser,
    heading: 'Welcome back',
    subtitle: 'Sign in to shop and track your orders',
    register: { text: 'New to ShopSphere?', label: 'Create an account', href: USER_REGISTER_URL },
  },
  seller: {
    label: 'Seller', Icon: FaStore,
    heading: 'Seller sign in',
    subtitle: 'Manage your store, products and orders',
    register: { text: 'Want to sell on ShopSphere?', label: 'Register your store', href: SELLER_REGISTER_URL },
  },
  admin: {
    label: 'Admin', Icon: FaShieldAlt,
    heading: 'Admin console',
    subtitle: 'Platform administration & operations',
    register: null,
  },
  delivery: {
    label: 'Delivery Partner', Icon: FaTruck,
    heading: 'Partner sign in',
    subtitle: 'Accept assignments and manage deliveries',
    register: null,
  },
}

const ROLE_ORDER = ['user', 'seller', 'delivery', 'admin']

// ─── Routing (no router lib — path + query) ──────────────────────────────────
// Supports both the dedicated /login/<role> paths and the existing ?role=
// deep links used by the seller/delivery apps, plus ?token= password resets.
function parseRoute() {
  const params = new URLSearchParams(window.location.search)
  const match = window.location.pathname.match(/^\/login\/(user|seller|admin|delivery)\/?$/)
  const roleFromPath = match ? match[1] : null
  const roleFromQuery = APP_ORIGINS[params.get('role')] ? params.get('role') : null
  const role = roleFromPath || roleFromQuery

  if (params.get('token')) {
    return { view: 'login', role: role || 'user', mode: 'reset' }
  }
  if (role) return { view: 'login', role, mode: 'login' }
  return { view: 'chooser' }
}

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

// Preserve ?redirect= when moving between screens so deep links survive.
function withPreservedQuery(path) {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''
  return path + q
}

// ─── Role chooser (landing) ──────────────────────────────────────────────────
function RoleChooser({ onPick }) {
  return (
    <div className="w-full max-w-[520px] animate-slide-up rounded-[28px] bg-white px-8 py-10 shadow-[0_24px_70px_rgba(30,58,138,0.12)]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-accent text-xl font-bold text-white shadow-soft">S</div>
        <p className="font-display text-lg font-extrabold text-ink tracking-tight">Shop<span className="text-brand-600">Sphere</span></p>
        <h1 className="mt-2 font-display text-[26px] font-extrabold leading-tight text-ink">Choose how you'll sign in</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Pick the space that matches your role.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_ORDER.map((id) => {
          const { label, Icon, subtitle } = ROLE_META[id]
          return (
            <button key={id} type="button" onClick={() => onPick(id)}
              className="group flex items-center gap-3 rounded-2xl border-0 ring-2 ring-slate-200 bg-white px-4 py-4 text-left transition-all duration-200 hover:ring-brand-500 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <Icon className="text-lg" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800">{label}</span>
                <span className="block text-xs font-medium text-slate-400 leading-tight">{subtitle}</span>
              </span>
              <FaArrowRight className="text-slate-300 transition-colors group-hover:text-brand-500" />
            </button>
          )
        })}
      </div>

      <p className="mt-7 text-center text-sm text-slate-500">
        New customer?{' '}
        <a href={USER_REGISTER_URL} className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">Create an account</a>
      </p>
    </div>
  )
}

// ─── Per-role login screen ───────────────────────────────────────────────────
function LoginScreen({ role, initialMode, onBack }) {
  const meta = ROLE_META[role]
  const params = new URLSearchParams(window.location.search)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState(params.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [mode, setMode] = useState(initialMode || 'login') // login | forgot | reset
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
        body: JSON.stringify({ email, password, role }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Invalid email or password')

      const target = new URL(safeRedirectForRole(role))
      target.searchParams.set('authId', result.id)
      target.searchParams.set('authName', result.name)
      target.searchParams.set('authEmail', result.email || email)
      target.searchParams.set('authRole', result.role || role)
      if (result.token) target.searchParams.set('authToken', result.token)
      window.location.href = target.toString()
    } catch (err) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    setLoading(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not request reset')
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
    setLoading(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not reset password')
      setNotice('Password reset. You can sign in with the new password now.')
      setPassword(''); setNewPassword(''); setMode('login')
    } catch (err) {
      setError(err.message || 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  const Icon = meta.Icon

  return (
    <div className="w-full max-w-[448px] animate-slide-up rounded-[28px] bg-white px-10 py-10 shadow-[0_24px_70px_rgba(30,58,138,0.12)]">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-brand-600 transition-colors">
        <FaArrowLeft size={12} /> All roles
      </button>

      {/* Branding header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-sky-accent text-white shadow-soft">
          <Icon className="text-2xl" />
        </div>
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-brand-600">{meta.label}</p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold leading-tight text-ink">{meta.heading}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">{meta.subtitle}</p>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
      )}

      {/* Forgot password */}
      {mode === 'forgot' && (
        <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-ink">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-11" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">{loading ? 'Sending...' : 'Send Reset Token'}</button>
          <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">Back to login</button>
        </form>
      )}

      {/* Reset password */}
      {mode === 'reset' && (
        <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="reset-token" className="mb-1.5 block text-sm font-medium text-ink">Reset Token</label>
            <input id="reset-token" type="text" placeholder="Token from backend console" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-ink">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input id="reset-password" type={showPassword ? 'text' : 'password'} minLength="8" autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="input-field pl-11 pr-11" />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">{loading ? 'Resetting...' : 'Reset Password'}</button>
          <button type="button" onClick={() => { setMode('login'); setError('') }} className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">Back to login</button>
        </form>
      )}

      {/* Login */}
      {mode === 'login' && (
        <form className="flex flex-col gap-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-11" />
            </div>
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pl-11 pr-11" />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-500 select-none">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600" />
              Remember me
            </label>
            <button type="button" onClick={() => { setMode('forgot'); setError(''); setNotice('') }} className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">{loading ? 'Logging in...' : `Sign in as ${meta.label}`}</button>
        </form>
      )}

      {/* Footer / registration link */}
      {meta.register ? (
        <p className="mt-7 text-center text-sm text-slate-500">
          {meta.register.text}{' '}
          <a href={meta.register.href} className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">{meta.register.label}</a>
        </p>
      ) : (
        <p className="mt-7 text-center text-xs text-slate-400">
          {meta.label} accounts are provisioned by ShopSphere. Contact an administrator for access.
        </p>
      )}
    </div>
  )
}

// ─── App shell ───────────────────────────────────────────────────────────────
function App() {
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onPop = () => setRoute(parseRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const goRole = (role) => {
    window.history.pushState({}, '', withPreservedQuery(`/login/${role}`))
    setRoute(parseRoute())
  }
  const goChooser = () => {
    window.history.pushState({}, '', withPreservedQuery('/'))
    setRoute({ view: 'chooser' })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f6faff] px-4 py-8 sm:py-12">
      {route.view === 'chooser'
        ? <RoleChooser onPick={goRole} />
        : <LoginScreen role={route.role} initialMode={route.mode} onBack={goChooser} />}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
