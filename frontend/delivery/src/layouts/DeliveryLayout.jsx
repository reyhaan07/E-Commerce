import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  FiGrid, FiPackage, FiClock, FiUser,
  FiMenu, FiX, FiBell, FiTruck, FiLogOut
} from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/delivery/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/delivery/orders',    label: 'Assigned Orders', icon: FiPackage },
  { to: '/delivery/history',   label: 'History', icon: FiClock },
  { to: '/delivery/profile',   label: 'Profile', icon: FiUser },
]

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

export default function DeliveryLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard'

  function handleLogout() {
    logout()
    navigate('/delivery/login', { replace: true })
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        glass-sidebar w-60 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:shrink-0
      `}>
        <div className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #059669, #0891b2)' }}>
              <FiTruck size={16} color="white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>ShopSphere</div>
              <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Delivery Partner</div>
            </div>
          </div>
          <button className="lg:hidden btn-icon" onClick={() => setSidebarOpen(false)}>
            <FiX size={16} />
          </button>
        </div>

        <div className="mx-4 my-4 p-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white' }}>
            {user?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Delivery Partner'}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
            style={{ color: 'var(--text-muted)' }}>Menu</div>
          {navItems.map(({ to, label, icon: Icon }) => (
            <SidebarLink key={to} to={to} label={label} Icon={Icon} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="px-3 pb-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="nav-link w-full text-left" style={{ color: '#e11d48' }} onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

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
                Welcome back, {user?.name || 'Delivery Partner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-icon relative">
              <FiBell size={17} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: '#059669', border: '2px solid white' }} />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white' }}>
              {user?.name?.[0]?.toUpperCase() || 'D'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav lg:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
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
