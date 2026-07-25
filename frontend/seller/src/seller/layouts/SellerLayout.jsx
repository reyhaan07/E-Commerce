import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiGrid, FiBox, FiLayers, FiShoppingBag, FiUser, FiSettings,
  FiMenu, FiX, FiBell, FiSearch, FiTrendingUp, FiLogOut, FiClock,
  FiAlertTriangle, FiChevronLeft, FiChevronDown, FiPlus, FiSun, FiMoon,
  FiMessageSquare, FiCheckCircle, FiBarChart2, FiExternalLink,
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { apiRequest } from '../api/client'

const SHARED_LOGIN_URL = 'http://localhost:5177'
const STOREFRONT_URL = 'http://localhost:5175'

const navGroups = [
  { title: 'Main', items: [
    { to: '/seller/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/seller/products',  label: 'Products',  icon: FiBox },
    { to: '/seller/inventory', label: 'Inventory', icon: FiLayers },
    { to: '/seller/orders',    label: 'Orders',    icon: FiShoppingBag },
  ]},
  { title: 'Account', items: [
    { to: '/seller/profile',   label: 'Profile',   icon: FiUser },
    { to: '/seller/settings',  label: 'Settings',  icon: FiSettings },
  ]},
]
const allNav = navGroups.flatMap(g => g.items)
const mobileNav = allNav.slice(0, 5)

const quickActions = [
  { label: 'Add Product',      icon: FiPlus,        to: '/seller/products' },
  { label: 'View Orders',      icon: FiShoppingBag, to: '/seller/orders' },
  { label: 'Manage Inventory', icon: FiLayers,      to: '/seller/inventory' },
  { label: 'Sales Report',     icon: FiBarChart2,   to: '/seller/dashboard' },
]

const verificationBadge = {
  Verified:  { cls: 'badge-success', icon: FiCheckCircle,   label: 'Verified' },
  Pending:   { cls: 'badge-warning', icon: FiClock,          label: 'Pending' },
  Suspended: { cls: 'badge-danger',  icon: FiAlertTriangle,  label: 'Suspended' },
}

function initials(name) { return (name?.trim()?.[0] || 'S').toUpperCase() }

function SidebarLink({ to, label, Icon, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}${collapsed ? ' justify-center px-0' : ''}`}
    >
      <Icon size={19} className="nav-ico shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)          // mobile drawer
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('seller_sidebar_collapsed') === '1' } catch { return false }
  })
  const [openMenu, setOpenMenu] = useState(null)                 // 'notif' | 'profile' | 'quick' | null
  const [verification, setVerification] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()

  const currentPage = allNav.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard'

  useEffect(() => {
    try { localStorage.setItem('seller_sidebar_collapsed', collapsed ? '1' : '0') } catch { /* ignore */ }
  }, [collapsed])

  // Close any open navbar menu when the route changes.
  useEffect(() => { setOpenMenu(null) }, [location.pathname])

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

  function go(to) { setOpenMenu(null); navigate(to) }

  const banner = verification && verification !== 'Verified'
    ? (verification === 'Suspended'
        ? { color: 'var(--danger)', soft: 'var(--danger-soft)', bd: 'var(--danger-bd)', Icon: FiAlertTriangle,
            head: 'Store suspended',
            text: 'Publishing is disabled until an admin reinstates your account.' }
        : { color: 'var(--warning)', soft: 'var(--warning-soft)', bd: 'var(--warning-bd)', Icon: FiClock,
            head: 'Verification in progress',
            text: 'You can set things up now, but publishing products stays disabled until an admin approves your application.' })
    : null

  const vb = verification && verificationBadge[verification]

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'transparent' }}>

      {/* ── Mobile overlay ──────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col p-3
          glass-sidebar transition-all duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex lg:shrink-0 lg:my-3 lg:ml-3 lg:rounded-3xl lg:h-[calc(100%-1.5rem)]
        `}
        style={{ width: collapsed ? 84 : 256 }}
      >
        {/* Logo + collapse */}
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <FiTrendingUp size={17} color="white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>ShopSphere</div>
              <div className="text-[11px] leading-none mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Seller Center</div>
            </div>
          )}
          <button className="btn-icon lg:hidden w-8 h-8" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <FiX size={16} />
          </button>
          <button
            className="btn-icon hidden lg:inline-flex w-8 h-8"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{ marginLeft: collapsed ? '-2px' : 0 }}
          >
            <FiChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>

        {/* Profile card */}
        <div className={`rounded-2xl flex items-center gap-3 mb-3 ${collapsed ? 'justify-center p-2' : 'p-3'}`}
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-hover)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', color: 'white' }}>
            {initials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'ShopSphere Store'}</div>
              {vb
                ? <span className={`badge ${vb.cls} mt-1`} style={{ fontSize: 10 }}><vb.icon size={10} />{vb.label}</span>
                : <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</div>}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
          {navGroups.map(group => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-3" style={{ color: 'var(--text-faint)' }}>
                  {group.title}
                </div>
              )}
              {group.items.map(({ to, label, icon: Icon }) => (
                <SidebarLink key={to} to={to} label={label} Icon={Icon} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: storefront + logout */}
        <div className="pt-3 mt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <a href={STOREFRONT_URL} target="_blank" rel="noreferrer"
            className={`nav-link${collapsed ? ' justify-center px-0' : ''}`} title={collapsed ? 'View storefront' : undefined}>
            <FiExternalLink size={19} className="nav-ico shrink-0" />
            {!collapsed && <span>View store</span>}
          </a>
          <button className={`nav-link w-full text-left${collapsed ? ' justify-center px-0' : ''}`}
            style={{ color: 'var(--danger)' }} onClick={handleLogout} title={collapsed ? 'Log out' : undefined}>
            <FiLogOut size={19} className="nav-ico shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 lg:px-6 py-3 relative z-30"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--topbar-bg)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          }}>
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button className="btn-icon lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <FiMenu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>Seller</span>
                <FiChevronDown size={11} style={{ transform: 'rotate(-90deg)' }} />
                <span style={{ color: 'var(--accent)' }}>{currentPage}</span>
              </div>
              <h1 className="text-base font-bold leading-none tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>{currentPage}</h1>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:flex items-center">
              <FiSearch size={14} className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search…" aria-label="Search" className="input pl-9 h-10 w-44 lg:w-56 text-xs" />
              <kbd className="absolute right-2.5 text-[10px] px-1.5 py-0.5 rounded-md font-sans hidden lg:block"
                style={{ background: 'var(--surface-3)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}>⌘K</kbd>
            </div>

            {/* Quick action */}
            <div className="relative">
              <button className="btn-primary h-10 hidden sm:inline-flex" onClick={() => setOpenMenu(m => m === 'quick' ? null : 'quick')}>
                <FiPlus size={16} /> <span className="hidden lg:inline">Quick actions</span>
                <FiChevronDown size={14} style={{ transform: openMenu === 'quick' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {openMenu === 'quick' && (
                  <motion.div className="menu right-0 mt-2 w-52 p-1.5"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }}>
                    {quickActions.map(a => (
                      <button key={a.label} className="menu-item w-full rounded-xl" onClick={() => go(a.to)}>
                        <a.icon size={15} style={{ color: 'var(--accent)' }} /> {a.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <button className="btn-icon hidden sm:inline-flex" aria-label="Messages" title="Messages"
              onClick={() => go('/seller/orders')}>
              <FiMessageSquare size={17} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="btn-icon relative" aria-label="Notifications"
                onClick={() => setOpenMenu(m => m === 'notif' ? null : 'notif')}>
                <FiBell size={17} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse-soft"
                  style={{ background: 'var(--accent)', border: '2px solid var(--surface)' }} />
              </button>
              <AnimatePresence>
                {openMenu === 'notif' && (
                  <motion.div className="menu right-0 mt-2 w-72"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                      <span className="badge badge-accent" style={{ fontSize: 10 }}>Live</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                        <FiCheckCircle size={22} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>You're all caught up</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>New orders and store alerts will show up here.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button className="btn-icon" aria-label="Toggle dark mode" title={isDark ? 'Light mode' : 'Dark mode'} onClick={toggleTheme}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={isDark ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="inline-flex">
                  {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* Avatar + profile menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-1 pr-1 sm:pr-2 py-1 rounded-xl transition-all duration-200"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                onClick={() => setOpenMenu(m => m === 'profile' ? null : 'profile')}
                aria-label="Account menu">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))', color: 'white' }}>
                  {initials(user?.name)}
                </div>
                <FiChevronDown size={14} className="hidden sm:block" style={{ color: 'var(--text-muted)', transform: openMenu === 'profile' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {openMenu === 'profile' && (
                  <motion.div className="menu right-0 mt-2 w-60 p-1.5"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }}>
                    <div className="px-3 py-2.5 mb-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Seller'}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    <button className="menu-item w-full rounded-xl" onClick={() => go('/seller/profile')}><FiUser size={15} /> Profile</button>
                    <button className="menu-item w-full rounded-xl" onClick={() => go('/seller/settings')}><FiSettings size={15} /> Settings</button>
                    <div className="divider !my-1.5" />
                    <button className="menu-item w-full rounded-xl" style={{ color: 'var(--danger)' }} onClick={handleLogout}><FiLogOut size={15} /> Log out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Click-away layer for open menus */}
        {openMenu && <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6">
          <AnimatePresence>
            {banner && (
              <motion.div className="flex items-start gap-3 mb-5 px-4 py-3.5 rounded-2xl"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: banner.soft, border: `1px solid ${banner.bd}` }}>
                <banner.Icon size={18} style={{ color: banner.color, marginTop: 1, flexShrink: 0 }} />
                <div className="text-sm" style={{ color: 'var(--text-soft)' }}>
                  <span className="font-semibold" style={{ color: banner.color }}>{banner.head}</span>
                  <span> — {banner.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="mobile-nav lg:hidden">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
