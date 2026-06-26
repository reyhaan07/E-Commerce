import React, { useState } from 'react'
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiCamera, FiStar, FiPackage } from 'react-icons/fi'

const profileStats = [
  { label: 'Total Sales',   value: '1,240', icon: <FiPackage />, iconBg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  { label: 'Total Revenue', value: '₹124K', icon: <span style={{ fontSize: 16 }}>₹</span>, iconBg: 'rgba(5,150,105,0.1)',   color: '#059669' },
  { label: 'Rating',        value: '4.8★',  icon: <FiStar />,      iconBg: 'rgba(217,119,6,0.1)',   color: '#d97706' },
]

const fields = [
  { label: 'Store Name', key: 'storeName', icon: FiUser },
  { label: 'Email',      key: 'email',     icon: FiMail },
  { label: 'Phone',      key: 'phone',     icon: FiPhone },
  { label: 'Address',    key: 'address',   icon: FiMapPin },
]

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    storeName: 'Apex Store', email: 'apex@store.com',
    phone: '+91 98765 43210', address: 'Mumbai, Maharashtra, India',
    bio: 'Premium electronics and lifestyle products. Trusted seller since 2021.',
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div><h2 className="page-title">Store Profile</h2><p className="page-subtitle">Manage your seller identity</p></div>
        {saved && <div className="badge badge-success px-4 py-2 text-sm animate-scale-in">✓ Changes saved</div>}
      </div>

      {/* Cover + Avatar */}
      <div className="glass overflow-hidden" style={{ borderRadius: 20 }}>
        <div className="h-32 relative" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(8,145,178,0.15) 50%, rgba(79,70,229,0.18) 100%)'
        }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                  border: '4px solid white', boxShadow: 'var(--shadow-md)' }}>A</div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-sm)' }}>
                <FiCamera size={12} />
              </button>
            </div>
            <button className={editing ? 'btn-primary' : 'btn-ghost'} onClick={() => editing ? handleSave() : setEditing(true)}>
              {editing ? '✓ Save Changes' : <><FiEdit2 size={14} /> Edit Profile</>}
            </button>
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{form.storeName}</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{form.bio}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {profileStats.map(s => (
          <div key={s.label} className="glass p-4 flex flex-col items-center text-center" style={{ borderRadius: 16 }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2"
              style={{ background: s.iconBg, color: s.color }}>{s.icon}</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form fields */}
      <div className="glass p-6 space-y-4" style={{ borderRadius: 20 }}>
        <h3 className="section-title">Store Information</h3>
        {fields.map(({ label, key, icon: Icon }) => (
          <div key={key}>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <div className="relative">
              <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type="text" className="input pl-10" value={form[key]} disabled={!editing}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ opacity: editing ? 1 : 0.7, background: editing ? 'white' : '#f8fafc' }} />
            </div>
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Store Bio</label>
          <textarea rows={3} className="input resize-none" value={form.bio} disabled={!editing}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            style={{ opacity: editing ? 1 : 0.7, background: editing ? 'white' : '#f8fafc' }} />
        </div>
        {editing && (
          <div className="flex gap-3 pt-1 animate-fade-in">
            <button className="btn-primary" onClick={handleSave}>Save Changes</button>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
