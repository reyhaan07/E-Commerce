import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FiMail, FiPhone, FiMapPin, FiEdit2, FiCamera, FiStar, FiPackage, FiShield, FiFileText, FiHome } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { SkeletonCard } from '../../components/Skeleton'

const VERIFY_BADGE = {
  Verified: 'badge-success',
  Pending: 'badge-warning',
  Suspended: 'badge-danger',
}

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`
}

export default function Profile() {
  const { user } = useAuth()
  const [account, setAccount] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null) // { text, error }
  const fileRef = useRef(null)

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const [me, ord, prod] = await Promise.all([
        apiRequest('/users/me'),
        apiRequest(`/orders?sellerId=${encodeURIComponent(user.id)}`),
        apiRequest('/products?sellerId=me&limit=48'),
      ])
      setAccount(me.user)
      setForm(fromAccount(me.user))
      setOrders(ord.orders || [])
      setProducts(prod.products || [])
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const active = orders.filter((o) => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((s, o) => s + o.amount, 0)
    const rated = products.filter((p) => p.ratingCount > 0)
    const rating = account?.sellerRatingCount
      ? account.sellerRating
      : (rated.length ? (rated.reduce((s, p) => s + p.rating, 0) / rated.length) : 0)
    return [
      { label: 'Total Orders', value: orders.length, icon: <FiPackage />, bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
      { label: 'Revenue', value: inr(revenue), icon: <span style={{ fontSize: 15 }}>₹</span>, bg: 'rgba(5,150,105,0.1)', color: '#059669' },
      { label: 'Rating', value: rating ? `${rating.toFixed(1)}★` : '—', icon: <FiStar />, bg: 'rgba(217,119,6,0.1)', color: '#d97706' },
    ]
  }, [orders, products, account])

  const locked = account?.verificationStatus === 'Verified' // gstin/pan read-only once verified

  async function handleSave() {
    setSaving(true)
    setFeedback(null)
    try {
      const body = {
        name: form.name,
        storeDescription: form.storeDescription,
        supportEmail: form.supportEmail,
        supportPhone: form.supportPhone,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        phone: form.phone,
      }
      if (!locked) { body.gstin = form.gstin; body.panNumber = form.panNumber }
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) })
      setAccount(res.user)
      setForm(fromAccount(res.user))
      setEditing(false)
      setFeedback({ text: 'Profile saved' })
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatar(file) {
    if (!file) return
    if (file.size > 1.4 * 1024 * 1024) { setFeedback({ text: 'Image must be under 1.4MB', error: true }); return }
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file)
    })
    try {
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ avatar: dataUrl }) })
      setAccount(res.user)
      setFeedback({ text: 'Logo updated' })
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="page-header"><div><h2 className="page-title">Store Profile</h2><p className="page-subtitle">Manage your seller identity</p></div></div>
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <div className="glass p-6" style={{ borderRadius: 20, height: 300 }} />
      </div>
    )
  }

  if (!account) {
    return <div className="glass p-6" style={{ borderRadius: 16 }}>Could not load your profile. {feedback?.text}</div>
  }

  const city = account.addresses?.find((a) => a.isDefault)?.city || account.addresses?.[0]?.city || '—'

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div><h2 className="page-title">Store Profile</h2><p className="page-subtitle">Manage your seller identity</p></div>
        {feedback && <div className={`badge ${feedback.error ? 'badge-danger' : 'badge-success'} px-4 py-2 text-sm animate-scale-in`}>{feedback.error ? '✕' : '✓'} {feedback.text}</div>}
      </div>

      {/* Cover + avatar + verification badge */}
      <div className="glass overflow-hidden" style={{ borderRadius: 20 }}>
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(8,145,178,0.15) 50%, rgba(79,70,229,0.18) 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: '4px solid white', boxShadow: 'var(--shadow-md)' }}>
                {account.avatar ? <img src={account.avatar} alt="" className="w-full h-full object-cover" /> : (account.name?.[0]?.toUpperCase() || 'S')}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent)', color: 'white', boxShadow: 'var(--shadow-sm)' }} onClick={() => fileRef.current?.click()} title="Change logo">
                <FiCamera size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatar(e.target.files?.[0])} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${VERIFY_BADGE[account.verificationStatus] || 'badge-neutral'}`}>
                <FiShield size={12} /> {account.verificationStatus || 'Unverified'}
              </span>
              {editing
                ? <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save'}</button>
                : <button className="btn-ghost" onClick={() => setEditing(true)}><FiEdit2 size={14} /> Edit</button>}
            </div>
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{account.name}</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{account.storeDescription || 'No store description yet.'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger">
        {stats.map((s) => (
          <div key={s.label} className="glass p-4 flex flex-col items-center text-center" style={{ borderRadius: 16 }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Store information form */}
      <div className="glass p-6 space-y-4" style={{ borderRadius: 20 }}>
        <h3 className="section-title">Store Information</h3>
        <FormField label="Store Name" icon={FiHome} value={form.name} editing={editing} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <FormField label="Business Name" icon={FiHome} value={form.businessName} editing={editing} onChange={(v) => setForm((f) => ({ ...f, businessName: v }))} />
        <FormField label="Support Email" icon={FiMail} value={form.supportEmail} editing={editing} onChange={(v) => setForm((f) => ({ ...f, supportEmail: v }))} placeholder={account.email} />
        <FormField label="Support Phone" icon={FiPhone} value={form.supportPhone} editing={editing} onChange={(v) => setForm((f) => ({ ...f, supportPhone: v }))} />
        <FormField label="Business Address" icon={FiMapPin} value={form.businessAddress} editing={editing} onChange={(v) => setForm((f) => ({ ...f, businessAddress: v }))} placeholder={city} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={`GSTIN${locked ? ' (verified — locked)' : ''}`} icon={FiFileText} value={form.gstin} editing={editing && !locked} onChange={(v) => setForm((f) => ({ ...f, gstin: v.toUpperCase() }))} />
          <FormField label={`PAN${locked ? ' (verified — locked)' : ''}`} icon={FiFileText} value={form.panNumber} editing={editing && !locked} onChange={(v) => setForm((f) => ({ ...f, panNumber: v.toUpperCase() }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Store Description</label>
          <textarea rows={3} className="input resize-none" value={form.storeDescription} disabled={!editing}
            onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))}
            style={{ opacity: editing ? 1 : 0.75, background: editing ? 'white' : '#f8fafc' }} />
        </div>
        {editing && (
          <div className="flex gap-3 pt-1 animate-fade-in">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button className="btn-ghost" onClick={() => { setForm(fromAccount(account)); setEditing(false) }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

function fromAccount(a) {
  return {
    name: a.name || '', storeDescription: a.storeDescription || '',
    supportEmail: a.supportEmail || '', supportPhone: a.supportPhone || '',
    businessName: a.businessName || '', businessAddress: a.businessAddress || '',
    gstin: a.gstin || '', panNumber: a.panNumber || '', phone: a.phone || '',
  }
}

function FormField({ label, icon: Icon, value, editing, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        <input type="text" className="input pl-10" value={value || ''} disabled={!editing} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ opacity: editing ? 1 : 0.75, background: editing ? 'white' : '#f8fafc' }} />
      </div>
    </div>
  )
}
