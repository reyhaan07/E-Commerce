import React from 'react'
import { FiUser, FiShoppingBag, FiMapPin, FiCreditCard, FiPower } from 'react-icons/fi'

// Structured so it drops straight onto React Router later: each item has a
// `key` (→ route) and the active one is driven by `activeKey`.
export const NAV = [
  { key: 'profile',   label: 'My Profile',   icon: FiUser },
  { key: 'orders',    label: 'My Orders',    icon: FiShoppingBag },
  { key: 'addresses', label: 'Address Book', icon: FiMapPin },
  { key: 'payments',  label: 'Payments',     icon: FiCreditCard },
]

export default function ProfileSidebar({ user, activeKey, onNavigate, onLogout, avatarUrl, open }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Identity card */}
      <div className="card id-card">
        <div className="id-cover" />
        <div className="id-body">
          <div className="id-avatar">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : user.initials}
          </div>
          <div className="id-name">{user.name}</div>
          <div className="id-since">Customer since {user.customerSince}</div>
          <div className="id-login">Last login: {user.lastLogin}</div>
          <div className="id-stats">
            <div className="id-stat">
              <div className="label">Status</div>
              <div className="value green">{user.status}</div>
            </div>
            <div className="id-stat">
              <div className="label">Points</div>
              <div className="value brand">{user.points}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation card */}
      <nav className="card nav-card">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item${activeKey === key ? ' active' : ''}`}
            onClick={() => onNavigate(key)}
            aria-current={activeKey === key ? 'page' : undefined}
          >
            <span className="n-ico"><Icon size={19} /></span>
            {label}
          </button>
        ))}
        <div className="nav-divider" />
        <button className="nav-item danger" onClick={onLogout}>
          <span className="n-ico"><FiPower size={19} /></span>
          Logout
        </button>
      </nav>
    </aside>
  )
}
