import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  FiGrid, FiBox, FiLayers, FiShoppingBag, FiUser, FiSettings,
  FiMenu, FiX, FiBell, FiSearch, FiTrendingUp, FiLogOut, FiClock, FiAlertTriangle
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../api/client'

const SHARED_LOGIN_URL = 'http://localhost:5177'

const navItems = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/seller/products',  label: 'Products',  icon: FiBox },
  { to: '/seller/inventory', label: 'Inventory', icon: FiLayers },
  { to: '/seller/orders',    label: 'Orders',    icon: FiShoppingBag },
  { to: '/seller/profile',   label: 'Profile',   icon: FiUser },
  { to: '/seller/settings',  label: 'Settings',  icon: FiSettings },
]

const mobileNav = navItems.slice(0, 5)

function SidebarLink({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [verification, setVerification] = useState(null) // account verificationStatus
  const location = useLocation()
  const { user, logout } = useAuth()
  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard'

  // Surface a persistent banner while the store isn't Verified yet (Feature 6).
  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiRequest('/users/me')
      .then((data) => { if (!cancelled) setVerification(data.user?.verificationStatus || null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, location.pathname])

  function handleLogout() {
    logout()
    window.location.href = `${SHARED_LOGIN_URL}?role=seller`
  }

  const banner = verification && verification !== 'Verified'
    ? (verification === 'Suspended'
        ? { cls: 'rgba(225,29,72,0.08)', border: 'rgba(225,29,72,0.25)', color: '#e11d48', Icon: FiAlertTriangle,
            text: 'Your store is suspended. Publishing is disabled until an admin reinstates your account.' }
        : { cls: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', color: '#d97706', Icon: FiClock,
            text: 'Your store is pending verification. You can set things up now, but publishing products stays disabled until an admin approves your application.' })
    : null

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Mobile overlay ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        glass-sidebar w-60 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:shrink-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #0891b2)' }}>
              <FiTrendingUp size={16} color="white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>ShopSphere</div>
              <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Seller</div>
            </div>
          </div>
          <button className="lg:hidden btn-icon" onClick={() => setSidebarOpen(false)}>
            <FiX size={16} />
          </button>
        </div>

        {/* Store info */}
        <div className="mx-4 my-4 p-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'ShopSphere Store'}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
            style={{ color: 'var(--text-muted)' }}>Menu</div>
          {navItems.map(({ to, label, icon: Icon }) => (
            <SidebarLink key={to} to={to} label={label} Icon={Icon} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="nav-link w-full text-left" style={{ color: '#e11d48' }} onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between gap-4 px-4 lg:px-6 py-3"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 1px 4px rgba(15,23,42,0.06)'
          }}>
          <div className="flex items-center gap-3">
            <button className="btn-icon lg:hidden" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{currentPage}</h1>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                Welcome back, {user?.name || 'Seller'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:flex items-center">
              <FiSearch size={14} className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search…" className="input pl-9 h-9 w-52 text-xs" />
            </div>

            {/* Notification bell */}
            <button className="btn-icon relative">
              <FiBell size={17} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: '#6366f1', border: '2px solid white' }} />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6">
          {banner && (
            <div className="flex items-start gap-3 mb-5 px-4 py-3 rounded-2xl animate-fade-in"
              style={{ background: banner.cls, border: `1px solid ${banner.border}` }}>
              <banner.Icon size={18} style={{ color: banner.color, marginTop: 1, flexShrink: 0 }} />
              <div className="text-sm" style={{ color: 'var(--text-soft)' }}>
                <span className="font-semibold" style={{ color: banner.color }}>
                  {verification === 'Suspended' ? 'Store suspended' : 'Verification in progress'}
                </span>
                <span> — {banner.text}</span>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ─────────────────────────────── */}
      <nav className="mobile-nav lg:hidden">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}