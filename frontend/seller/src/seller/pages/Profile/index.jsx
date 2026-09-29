import React, { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { SkeletonCard } from '../../components/Skeleton'
import {
  FiMail, FiPhone, FiMapPin, FiEdit2, FiCamera, FiStar, FiPackage, FiShield,
  FiFileText, FiHome, FiDollarSign, FiCalendar, FiHash, FiCheck,
} from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
function fromAccount(a) {
  return {
    name: a.name || '', storeDescription: a.storeDescription || '',
    supportEmail: a.supportEmail || '', supportPhone: a.supportPhone || '',
    businessName: a.businessName || '', businessAddress: a.businessAddress || '',
    gstin: a.gstin || '', panNumber: a.panNumber || '', phone: a.phone || '',
  }
}

export default function Profile() {
  const { user } = useAuth()
  const toast = useToast()
  const [account, setAccount] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
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
      setAccount(me.user); setForm(fromAccount(me.user))
      setOrders(ord.orders || []); setProducts(prod.products || [])
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const active = orders.filter(o => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((s, o) => s + o.amount, 0)
    const rated = products.filter(p => p.ratingCount > 0)
    const rating = account?.sellerRatingCount ? account.sellerRating : (rated.length ? rated.reduce((s, p) => s + p.rating, 0) / rated.length : 0)
    return [
      { label: 'Total Orders', value: orders.length, icon: FiPackage, tint: ['var(--accent-soft)', 'var(--accent)'] },
      { label: 'Revenue', value: inr(revenue), icon: FiDollarSign, tint: ['var(--success-soft)', 'var(--success)'] },
      { label: 'Rating', value: rating ? `${rating.toFixed(1)}★` : '—', icon: FiStar, tint: ['var(--amber-soft)', 'var(--amber)'] },
    ]
  }, [orders, products, account])

  const locked = account?.verificationStatus === 'Verified'

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        name: form.name, storeDescription: form.storeDescription, supportEmail: form.supportEmail,
        supportPhone: form.supportPhone, businessName: form.businessName, businessAddress: form.businessAddress, phone: form.phone,
      }
      if (!locked) { body.gstin = form.gstin; body.panNumber = form.panNumber }
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify(body) })
      setAccount(res.user); setForm(fromAccount(res.user)); setEditing(false); toast.success('Profile saved')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleAvatar(file) {
    if (!file) return
    if (file.size > 1.4 * 1024 * 1024) { toast.error('Image must be under 1.4MB'); return }
    const dataUrl = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file) })
    try { const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ avatar: dataUrl }) }); setAccount(res.user); toast.success('Logo updated') }
    catch (err) { toast.error(err.message) }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Store Profile" subtitle="Manage your seller identity and business details." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
  }
  if (!account) return <div className="card p-6">Could not load your profile.</div>

  const city = account.addresses?.find(a => a.isDefault)?.city || account.addresses?.[0]?.city || '—'
  const addr = account.addresses?.find(a => a.isDefault) || account.addresses?.[0]
  const memberSince = account.createdAt ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Store Profile" subtitle="Manage your seller identity and business details."
        actions={editing
          ? <><button className="btn-ghost" onClick={() => { setForm(fromAccount(account)); setEditing(false) }} disabled={saving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : <><FiCheck size={15} /> Save Changes</>}</button></>
          : <button className="btn-primary" onClick={() => setEditing(true)}><FiEdit2 size={15} /> Edit Profile</button>} />

      {/* Header card */}
      <div className="card overflow-hidden">
        <div className="h-24" style={{ background: 'linear-gradient(120deg, var(--accent) 0%, var(--accent-deep) 100%)' }} />
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black overflow-hidden"
                style={{ background: 'var(--accent)', color: '#fff', border: '4px solid var(--surface)', boxShadow: 'var(--shadow-md)' }}>
                {account.avatar ? <img src={account.avatar} alt="" className="w-full h-full object-cover" /> : (account.name?.[0]?.toUpperCase() || 'S')}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#fff', border: '2px solid var(--surface)' }} onClick={() => fileRef.current?.click()} title="Change logo"><FiCamera size={12} /></button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleAvatar(e.target.files?.[0])} />
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{account.name}</h2>
                <StatusBadge status={account.verificationStatus || 'Pending'} label={account.verificationStatus || 'Unverified'} />
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{account.storeDescription || 'No store description yet.'}</p>
            </div>
          </div>
          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {stats.map(s => (
              <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="soft-icon" style={{ background: s.tint[0], color: s.tint[1] }}><s.icon size={17} /></div>
                <div className="min-w-0">
                  <div className="text-base font-bold tnum truncate" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Store information form */}
        <SectionCard className="lg:col-span-2" icon={<FiHome size={17} />} title="Store Information" description="Business identity shown on your storefront.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Store Name" icon={FiHome} value={form.name} editing={editing} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <FormField label="Business Name" icon={FiHome} value={form.businessName} editing={editing} onChange={v => setForm(f => ({ ...f, businessName: v }))} />
            <FormField label="Support Email" icon={FiMail} value={form.supportEmail} editing={editing} onChange={v => setForm(f => ({ ...f, supportEmail: v }))} placeholder={account.email} />
            <FormField label="Support Phone" icon={FiPhone} value={form.supportPhone} editing={editing} onChange={v => setForm(f => ({ ...f, supportPhone: v }))} />
            <FormField label="Business Address" icon={FiMapPin} value={form.businessAddress} editing={editing} onChange={v => setForm(f => ({ ...f, businessAddress: v }))} placeholder={city} className="sm:col-span-2" />
            <FormField label={`GSTIN${locked ? ' (locked)' : ''}`} icon={FiFileText} value={form.gstin} editing={editing && !locked} onChange={v => setForm(f => ({ ...f, gstin: v.toUpperCase() }))} />
            <FormField label={`PAN${locked ? ' (locked)' : ''}`} icon={FiFileText} value={form.panNumber} editing={editing && !locked} onChange={v => setForm(f => ({ ...f, panNumber: v.toUpperCase() }))} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>Store Description</label>
            <textarea rows={3} className="input" value={form.storeDescription} disabled={!editing}
              onChange={e => setForm(f => ({ ...f, storeDescription: e.target.value }))}
              style={{ opacity: editing ? 1 : 0.8, background: editing ? 'var(--input-bg)' : 'var(--surface-2)' }} />
          </div>
        </SectionCard>

        {/* Right rail: verification + address + account */}
        <div className="space-y-5">
          <SectionCard icon={<FiShield size={17} />} iconTint={account.verificationStatus === 'Verified' ? 'green' : 'orange'} title="Verification">
            <div className="flex items-center justify-between py-1">
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Status</span>
              <StatusBadge status={account.verificationStatus || 'Pending'} label={account.verificationStatus || 'Unverified'} />
            </div>
            {account.verificationReason && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{account.verificationReason}</p>}
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {account.verificationStatus === 'Verified' ? 'Your store is verified and can publish products.' : 'Publishing stays disabled until an admin approves your store.'}
            </p>
          </SectionCard>

          <SectionCard icon={<FiMapPin size={17} />} title="Store Address">
            {addr ? (
              <div className="text-sm space-y-0.5" style={{ color: 'var(--text-soft)' }}>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr.line1}</div>
                {addr.line2 && <div>{addr.line2}</div>}
                <div>{addr.city}, {addr.state}</div>
                <div>PIN {addr.pincode}</div>
              </div>
            ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No address on file.</p>}
          </SectionCard>

          <SectionCard icon={<FiHash size={17} />} title="Account">
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><FiCalendar size={14} /> Member since</span>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{memberSince}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><FiHash size={14} /> Seller ID</span>
              <span className="text-[13px] font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{account.id}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><FiMail size={14} /> Login email</span>
              <span className="text-[13px] font-semibold truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>{account.email}</span>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, icon: Icon, value, editing, onChange, placeholder, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
        <input type="text" className="input pl-9" value={value || ''} disabled={!editing} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ opacity: editing ? 1 : 0.8, background: editing ? 'var(--input-bg)' : 'var(--surface-2)' }} />
      </div>
    </div>
  )
}
