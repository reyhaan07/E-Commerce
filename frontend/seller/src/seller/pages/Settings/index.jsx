import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import {
  FiBell, FiShield, FiUser, FiGlobe, FiInfo, FiChevronRight, FiMail, FiPhone,
  FiExternalLink, FiCalendar, FiCreditCard, FiHash, FiTruck, FiPlus, FiX, FiCheck, FiMapPin,
} from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { SHARED_LOGIN_URL } from '../../config/appNav'

function Toggle({ enabled, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="switch" data-on={enabled} aria-pressed={enabled} aria-label="Toggle">
      <span className="switch-track" /><span className="switch-thumb" />
    </button>
  )
}

function Row({ label, value, control, icon: Icon, top, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick} className={`flex items-center justify-between gap-3 py-3 w-full text-left ${onClick ? 'transition-colors hover:opacity-80' : ''}`}
      style={{ borderTop: top ? '1px solid var(--border)' : undefined }}>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {value && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{value}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        {control}{Icon && <Icon size={15} />}
      </div>
    </Comp>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [saving, setSaving] = useState(false)
  // Delivery serviceability (Part B)
  const [warehousePin, setWarehousePin] = useState('')
  const [pins, setPins] = useState([])
  const [newPin, setNewPin] = useState('')
  const [savingPins, setSavingPins] = useState(false)

  useEffect(() => {
    if (!user) return
    apiRequest('/users/me').then(d => setAccount(d.user)).catch(() => {})
  }, [user])

  // sync the delivery-area editor whenever the account loads/changes
  useEffect(() => {
    if (account) {
      setWarehousePin(account.warehousePincode || '')
      setPins(account.serviceablePincodes || [])
    }
  }, [account])

  function addPin() {
    const p = newPin.trim()
    if (!/^\d{6}$/.test(p)) { toast.error('Enter a valid 6-digit PIN code'); return }
    if (pins.includes(p)) { setNewPin(''); return }
    setPins(prev => [...prev, p]); setNewPin('')
  }
  function removePin(p) { setPins(prev => prev.filter(x => x !== p)) }
  async function saveDeliveryAreas() {
    if (warehousePin && !/^\d{6}$/.test(warehousePin)) { toast.error('Dispatch PIN must be 6 digits'); return }
    setSavingPins(true)
    try {
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ warehousePincode: warehousePin, serviceablePincodes: pins }) })
      setAccount(res.user); toast.success('Delivery areas saved')
    } catch (err) { toast.error(err.message) } finally { setSavingPins(false) }
  }

  async function toggle(key) {
    if (!account) return
    const next = !account[key]
    setSaving(true)
    setAccount(a => ({ ...a, [key]: next }))
    try {
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ [key]: next }) })
      setAccount(res.user); toast.success('Preferences saved')
    } catch (err) {
      setAccount(a => ({ ...a, [key]: !next })); toast.error(err.message)
    } finally { setSaving(false) }
  }

  const memberSince = account?.createdAt ? new Date(account.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const sellerCode = account ? `SPH-${(account.id || '').toUpperCase()}` : '—'

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Settings" subtitle="Manage your account and store preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left column */}
        <div className="space-y-5">
          <SectionCard icon={<FiBell size={17} />} title="Notifications" description="Choose how you want to stay updated.">
            <Row label="Email notifications" value="Order updates, payouts and platform notices by email"
              control={<Toggle enabled={!!account?.notifyByEmail} onToggle={() => toggle('notifyByEmail')} disabled={!account || saving} />} />
            <Row top label="SMS notifications" value="Time-sensitive alerts by text message"
              control={<Toggle enabled={!!account?.notifyBySms} onToggle={() => toggle('notifyBySms')} disabled={!account || saving} />} />
          </SectionCard>

          <SectionCard icon={<FiUser size={17} />} title="Account Information" description="Manage your store identity and contact details.">
            <Row label="Store Name" value={account?.name || '—'} />
            <Row top label="Email Address" value={account?.email || '—'} icon={FiMail} />
            <Row top label="Phone Number" value={account?.phone || 'Not set'} icon={FiPhone} />
            <Row top label="Edit store profile" value="Update your store description, logo and more"
              control={<FiChevronRight size={16} />} onClick={() => navigate('/seller/profile')} />
          </SectionCard>

          <SectionCard icon={<FiShield size={17} />} title="Security" description="Protect your seller account.">
            <Row label="Password" value="Reset your password from the sign-in screen"
              control={<a className="btn-ghost btn-sm" href={`${SHARED_LOGIN_URL}/login/seller`} target="_blank" rel="noreferrer">Change Password <FiExternalLink size={12} /></a>} />
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <SectionCard icon={<FiGlobe size={17} />} title="Store Preferences" description="Set regional and operational preferences.">
            <Row label="Currency" value="INR — Indian Rupee" icon={FiChevronRight} />
            <Row top label="Timezone" value="Asia/Kolkata (IST +5:30)" icon={FiChevronRight} />
            <Row top label="GSTIN" value={account?.gstin || 'Not provided'} />
            <Row top label="Regional defaults" value="Delivery, return and order preferences"
              control={<FiChevronRight size={16} />} onClick={() => navigate('/seller/profile')} />
          </SectionCard>

          <SectionCard icon={<FiInfo size={17} />} title="About Store" description="View key details about your store.">
            <Row label="Member Since" value={memberSince} icon={FiCalendar} />
            <Row top label="Store Status" control={<StatusBadge status={account?.status === 'active' ? 'Active' : (account?.verificationStatus || 'Pending')} />} />
            <Row top label="Plan" value="Standard Seller" icon={FiCreditCard} />
            <Row top label="Seller ID" value={sellerCode} icon={FiHash} />
          </SectionCard>
        </div>
      </div>

      {/* Delivery Areas (Part B) — the PIN codes this store delivers to */}
      <SectionCard icon={<FiTruck size={17} />} iconTint="green" title="Delivery Areas"
        description="Set your dispatch PIN and the customer PIN codes you deliver to. Orders to a PIN not listed here show as “delivery unavailable”.">
        <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-6">
          {/* Dispatch PIN */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Dispatch / Warehouse PIN</label>
            <div className="relative mt-2">
              <FiMapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
              <input className="input pl-9" inputMode="numeric" maxLength={6} placeholder="e.g. 600100"
                value={warehousePin} onChange={e => setWarehousePin(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Used to match nearby delivery partners.</p>
          </div>

          {/* Serviceable PINs */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Serviceable customer PINs ({pins.length})
            </label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3 min-h-[34px]">
              {pins.length === 0 && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>No PIN codes yet — add the ones you deliver to.</span>}
              {pins.map(p => (
                <span key={p} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 h-8 rounded-lg text-sm font-semibold tnum"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', border: '1px solid var(--border-hover)' }}>
                  {p}
                  <button onClick={() => removePin(p)} aria-label={`Remove ${p}`}
                    className="w-5 h-5 rounded-md inline-flex items-center justify-center" style={{ color: 'var(--accent-ink)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                    <FiX size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input" inputMode="numeric" maxLength={6} placeholder="Add a 6-digit PIN and press Enter"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPin() } }} />
              <button className="btn-secondary shrink-0" onClick={addPin}><FiPlus size={16} /> Add</button>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn-primary" onClick={saveDeliveryAreas} disabled={savingPins}>
            {savingPins ? 'Saving…' : <><FiCheck size={16} /> Save delivery areas</>}
          </button>
        </div>
      </SectionCard>

      <p className="text-center text-xs pt-2" style={{ color: 'var(--text-faint)' }}>
        <FiShield size={12} className="inline mr-1" style={{ verticalAlign: '-1px' }} />
        Your data is secure and encrypted · ShopSphere © {new Date().getFullYear()}
      </p>
    </div>
  )
}
