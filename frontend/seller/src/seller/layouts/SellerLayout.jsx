import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiX, FiClock, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { apiRequest } from '../api/client'
import SellerSidebar from '../components/shell/SellerSidebar'
import SellerHeader from '../components/shell/SellerHeader'
import { NAV_ITEMS, MOBILE_NAV, SHARED_LOGIN_URL } from '../config/appNav'

// Account.status === "suspended" (set from admin > Seller Management) is a
// different thing from verificationStatus === "Suspended": it suspends the whole
// account, and the API now rejects every seller write with 403 while it holds.
// It outranks the verification banner below.
const ACCOUNT_SUSPENDED_BANNER = {
  color: 'var(--danger)', soft: 'var(--danger-soft)', bd: 'var(--danger-bd)', Icon: FiAlertTriangle,
  head: 'Account suspended',
  text: 'A platform administrator has suspended this account. You can still view your store, but adding or editing products, updating your store profile and acting on orders are disabled until it is reinstated.',
}

const BANNERS = {
  Pending: {
    color: 'var(--warning)', soft: 'var(--warning-soft)', bd: 'var(--warning-bd)', Icon: FiClock,
    head: 'Verification in progress',
    text: 'You can set things up now, but publishing products stays disabled until an admin approves your application.',
  },
  Suspended: {
    color: 'var(--danger)', soft: 'var(--danger-soft)', bd: 'var(--danger-bd)', Icon: FiAlertTriangle,
    head: 'Store suspended',
    text: 'Publishing is disabled until an admin reinstates your account.',
  },
}

export default function SellerLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [account, setAccount] = useState(null)
  const [counts, setCounts] = useState({ orders: 0 })
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const currentPage = NAV_ITEMS.find(n => n.to && location.pathname.startsWith(n.to))?.label
    || (location.pathname.includes('/profile') ? 'Profile' : 'Dashboard')

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // Shell-level data: the full account (avatar + verification) and a live
  // order count for the sidebar badge. Pages fetch their own data separately.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiRequest('/users/me').then(d => { if (!cancelled) setAccount(d.user) }).catch(() => {})
    apiRequest(`/orders?sellerId=${encodeURIComponent(user.id)}`)
      .then(d => { if (!cancelled) setCounts({ orders: d.orders?.length || 0 }) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, location.pathname])

  function handleLogout() {
    logout()
    window.location.href = `${SHARED_LOGIN_URL}?role=seller`
  }

  const shellUser = { ...(user || {}), ...(account || {}) }
  const verification = account?.verificationStatus || null
  const suspended = Boolean(account) && account.status !== 'active'
  const banner = suspended ? ACCOUNT_SUSPENDED_BANNER : (verification && BANNERS[verification])

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-app)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 px-3 py-3"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>
        <SellerSidebar user={shellUser} verification={verification} counts={counts} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'var(--overlay)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)} />
            <motion.aside className="fixed top-0 left-0 h-full w-72 z-50 lg:hidden flex flex-col px-3 py-3"
              style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}>
              <button className="btn-icon absolute top-3 right-3 z-10" onClick={() => setDrawerOpen(false)} aria-label="Close menu"><FiX size={17} /></button>
              <SellerSidebar user={shellUser} verification={verification} counts={counts}
                onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <SellerHeader user={shellUser} currentPage={currentPage}
          onOpenSidebar={() => setDrawerOpen(true)} onLogout={handleLogout} notifCount={0} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 pb-24 lg:pb-6">
          <AnimatePresence>
            {banner && (
              <motion.div className="flex items-start gap-3 mb-5 px-4 py-3.5 rounded-xl"
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
          <Outlet context={{ account, counts, suspended }} />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav lg:hidden">
        {MOBILE_NAV.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <div className="relative">
              <Icon size={20} />
              {badge && counts[badge] > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--accent)', color: '#fff' }}>{counts[badge]}</span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
