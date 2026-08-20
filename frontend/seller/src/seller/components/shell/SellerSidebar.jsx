import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiShoppingBag, FiCheckCircle, FiClock, FiAlertTriangle,
  FiLogOut, FiExternalLink, FiLifeBuoy, FiArrowRight,
} from 'react-icons/fi'
import { NAV_ITEMS, STOREFRONT_URL } from '../../config/appNav'

const VERIFICATION = {
  Verified:  { cls: 'badge-success', icon: FiCheckCircle,  label: 'Verified Seller' },
  Pending:   { cls: 'badge-warning', icon: FiClock,         label: 'Verification Pending' },
  Suspended: { cls: 'badge-danger',  icon: FiAlertTriangle, label: 'Suspended' },
}

function initials(name) { return (name?.trim()?.[0] || 'S').toUpperCase() }

function NavRow({ item, counts, onNavigate }) {
  const Icon = item.icon
  const count = item.badge ? counts?.[item.badge] : null

  const inner = (active) => (
    <>
      <Icon size={18} className="nav-ico shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
      {item.external && <FiExternalLink size={13} className="nav-ico shrink-0" />}
      {!item.external && count > 0 && (
        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          style={active
            ? { background: 'rgba(255,255,255,0.22)', color: '#fff' }
            : { background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>
          {count}
        </span>
      )}
    </>
  )

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="nav-link" onClick={onNavigate}>
        {inner(false)}
      </a>
    )
  }
  return (
    <NavLink to={item.to} onClick={onNavigate}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      {({ isActive }) => inner(isActive)}
    </NavLink>
  )
}

export default function SellerSidebar({ user, verification, counts, onNavigate, onLogout }) {
  const vb = verification && VERIFICATION[verification]

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 h-16 shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--accent)' }}>
          <FiShoppingBag size={19} color="#fff" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>ShopSphere</div>
          <div className="text-[11px] leading-none mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Seller Center</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-1 mb-3 p-3 rounded-xl flex items-center gap-3"
        style={{ background: 'var(--accent-softer)', border: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials(user?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {user?.name || 'ShopSphere Store'}
          </div>
          {vb
            ? <span className={`badge ${vb.cls} mt-1`} style={{ fontSize: 10, padding: '2px 7px' }}><vb.icon size={10} />{vb.label}</span>
            : <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email || 'Seller account'}</div>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.label} item={item} counts={counts} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Promo card */}
      <div className="mx-1 mt-3 p-3.5 rounded-xl relative overflow-hidden"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-hover)' }}>
        <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Grow your business</div>
        <div className="text-[11px] mt-0.5 mb-2.5 leading-snug" style={{ color: 'var(--text-muted)' }}>
          Optimize your listings and boost your sales.
        </div>
        <a href={STOREFRONT_URL} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg"
          style={{ background: 'var(--surface)', color: 'var(--accent-ink)', border: '1px solid var(--border-hover)' }}>
          View Storefront <FiArrowRight size={13} />
        </a>
      </div>

      {/* Footer: support + logout */}
      <div className="px-1 pt-2 mt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <a href="mailto:support@shopsphere.com" className="nav-link" onClick={onNavigate}>
          <FiLifeBuoy size={18} className="nav-ico shrink-0" />
          <span>Contact Support</span>
        </a>
        <button className="nav-link w-full text-left" style={{ color: 'var(--danger)' }} onClick={onLogout}>
          <FiLogOut size={18} className="nav-ico shrink-0" style={{ color: 'var(--danger)' }} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )
}
