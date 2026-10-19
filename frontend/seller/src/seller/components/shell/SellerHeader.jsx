import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiMenu, FiSearch, FiPlus, FiChevronDown,
  FiUser, FiSettings, FiLogOut,
} from 'react-icons/fi'
import { QUICK_ACTIONS } from '../../config/appNav'

function initials(name) { return (name?.trim()?.[0] || 'S').toUpperCase() }

export default function SellerHeader({ user, currentPage, onOpenSidebar, onLogout }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(null) // 'quick' | 'profile' | null
  const rootRef = useRef(null)

  // close menus on outside click / escape
  useEffect(() => {
    function onDoc(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(null) }
    function onKey(e) { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  function go(target) {
    setOpen(null)
    if (target.external) window.open(target.href, '_blank')
    else navigate(target.to)
  }

  const dd = {
    initial: { opacity: 0, y: -6, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6, scale: 0.98 },
    transition: { duration: 0.14 },
  }

  return (
    <header ref={rootRef}
      className="shrink-0 flex items-center gap-3 px-4 lg:px-6 h-16 relative z-30"
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
      {/* Left: hamburger + breadcrumb */}
      <button className="btn-icon lg:hidden" onClick={onOpenSidebar} aria-label="Open menu"><FiMenu size={18} /></button>
      <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium min-w-0">
        <span style={{ color: 'var(--text-muted)' }}>Seller</span>
        <FiChevronDown size={12} style={{ transform: 'rotate(-90deg)', color: 'var(--text-faint)' }} />
        <span className="font-semibold truncate" style={{ color: 'var(--accent-ink)' }}>{currentPage}</span>
      </div>

      {/* Search — grows to fill */}
      <div className="relative flex-1 max-w-md ml-auto sm:ml-4">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
        <input type="text" placeholder="Search anything…" aria-label="Search"
          className="input pl-9 pr-12 h-10 w-full" />
        <kbd className="kbd absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:block">⌘K</kbd>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick actions */}
        <div className="relative">
          <button className="btn-primary h-10" onClick={() => setOpen(o => o === 'quick' ? null : 'quick')}>
            <FiPlus size={16} /> <span className="hidden sm:inline">Quick actions</span>
            <FiChevronDown size={14} style={{ transform: open === 'quick' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          <AnimatePresence>
            {open === 'quick' && (
              <motion.div className="menu right-0 mt-2 w-56" {...dd}>
                {QUICK_ACTIONS.map(a => (
                  <button key={a.label} className="menu-item w-full" onClick={() => go(a)}>
                    <a.icon size={15} style={{ color: 'var(--accent)' }} /> {a.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-xl transition-colors"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            onClick={() => setOpen(o => o === 'profile' ? null : 'profile')} aria-label="Account menu">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials(user?.name)}
            </div>
            <span className="text-[13px] font-semibold hidden md:block max-w-[110px] truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name?.split(' ')[0] || 'Seller'}
            </span>
            <FiChevronDown size={14} className="hidden md:block" style={{ color: 'var(--text-muted)', transform: open === 'profile' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          <AnimatePresence>
            {open === 'profile' && (
              <motion.div className="menu right-0 mt-2 w-60" {...dd}>
                <div className="px-3 py-2.5 mb-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Seller'}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <button className="menu-item w-full" onClick={() => { setOpen(null); navigate('/seller/profile') }}><FiUser size={15} /> Profile</button>
                <button className="menu-item w-full" onClick={() => { setOpen(null); navigate('/seller/settings') }}><FiSettings size={15} /> Settings</button>
                <div className="divider" />
                <button className="menu-item w-full" style={{ color: 'var(--danger)' }} onClick={onLogout}><FiLogOut size={15} /> Log out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
