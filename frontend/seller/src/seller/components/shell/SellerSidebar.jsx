import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  FiShoppingBag, FiCheckCircle, FiClock, FiAlertTriangle,
  FiLogOut, FiExternalLink, FiLifeBuoy, FiArrowRight,
} from 'react-icons/fi'
import { NAV_ITEMS, STOREFRONT_URL } from '../../config/appNav'
import ContactSupportModal from './ContactSupportModal'

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
            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
            : { background: '#2563eb', color: '#ffffff' }}>
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
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 h-16 shrink-0 border-b border-slate-800 pb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 shrink-0">
          S
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-base text-white leading-tight tracking-tight">ShopSphere</div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Seller Center</div>
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-1 my-3 p-3 rounded-xl flex items-center gap-3 bg-slate-800 border border-slate-700/80">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials(user?.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate text-white">
            {user?.name || 'ShopSphere Store'}
          </div>
          {vb
            ? <span className={`badge ${vb.cls} mt-1`} style={{ fontSize: 10, padding: '2px 7px' }}><vb.icon size={10} />{vb.label}</span>
            : <div className="text-[11px] truncate mt-0.5 text-slate-400">{user?.email || 'Seller account'}</div>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.label} item={item} counts={counts} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Promo card */}
      <div className="mx-1 mt-3 p-3.5 rounded-xl relative overflow-hidden bg-slate-800/80 border border-slate-700/80">
        <div className="text-[13px] font-semibold text-white">Grow your business</div>
        <div className="text-[11px] mt-0.5 mb-2.5 leading-snug text-slate-400">
          Optimize your listings and boost your sales.
        </div>
        <a href={STOREFRONT_URL} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
          View Storefront <FiArrowRight size={13} />
        </a>
      </div>

      {/* Footer: support + logout */}
      <div className="px-1 pt-2 mt-2 space-y-1 border-t border-slate-800">
        <button type="button" className="nav-link w-full text-left" onClick={() => setSupportOpen(true)}>
          <FiLifeBuoy size={18} className="nav-ico shrink-0" />
          <span>Contact Support</span>
        </button>
        <button className="nav-link w-full text-left !text-red-400 hover:!text-red-300 hover:!bg-red-500/10" onClick={onLogout}>
          <FiLogOut size={18} className="nav-ico shrink-0 !text-red-400" />
          <span>Log Out</span>
        </button>
      </div>

      <ContactSupportModal open={supportOpen} onClose={() => { setSupportOpen(false); onNavigate?.() }} />
    </div>
  )
}
