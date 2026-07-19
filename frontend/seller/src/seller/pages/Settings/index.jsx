import React, { useEffect, useState } from 'react'
import { FiBell, FiShield, FiUser, FiGlobe, FiChevronRight, FiMail, FiPhone, FiExternalLink } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const SHARED_LOGIN_URL = 'http://localhost:5177'

function Toggle({ enabled, onToggle, disabled }) {
  return (
    <button onClick={onToggle} disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-50"
      style={{ background: enabled ? 'var(--accent)' : '#cbd5e1' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
        style={{ left: enabled ? '1.4rem' : '0.125rem', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
    </button>
  )
}

function SettingSection({ icon: Icon, title, description, children }) {
  return (
    <div className="glass p-5" style={{ borderRadius: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--accent)' }}>
          <Icon size={17} />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
          {description && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Row({ label, description, control, top }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderTop: top ? '1px solid var(--border)' : undefined }}>
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {description && <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{description}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const [account, setAccount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!user) return
    apiRequest('/users/me').then((d) => setAccount(d.user)).catch(() => {})
  }, [user])

  async function toggle(key) {
    if (!account) return
    const next = !account[key]
    setSaving(true)
    setFeedback('')
    // optimistic
    setAccount((a) => ({ ...a, [key]: next }))
    try {
      const res = await apiRequest('/users/me', { method: 'PATCH', body: JSON.stringify({ [key]: next }) })
      setAccount(res.user)
      setFeedback('Preferences saved')
    } catch (err) {
      setAccount((a) => ({ ...a, [key]: !next })) // revert
      setFeedback(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div><h2 className="page-title">Settings</h2><p className="page-subtitle">Manage your account preferences</p></div>
        {feedback && <div className="badge badge-success px-4 py-2 text-sm animate-scale-in">{feedback}</div>}
      </div>

      <SettingSection icon={FiBell} title="Notifications" description="How ShopSphere reaches you about orders and payouts">
        <Row top label="Email notifications" description="Order updates, payouts and platform notices by email"
          control={<Toggle enabled={!!account?.notifyByEmail} onToggle={() => toggle('notifyByEmail')} disabled={!account || saving} />} />
        <Row top label="SMS notifications" description="Time-sensitive alerts by text message"
          control={<Toggle enabled={!!account?.notifyBySms} onToggle={() => toggle('notifyBySms')} disabled={!account || saving} />} />
      </SettingSection>

      <SettingSection icon={FiUser} title="Account" description="Your seller identity">
        <Row top label="Name" description={account?.name || '—'} control={null} />
        <Row top label="Email" description={account?.email || '—'} control={<FiMail size={15} style={{ color: 'var(--text-muted)' }} />} />
        <Row top label="Phone" description={account?.phone || 'Not set'} control={<FiPhone size={15} style={{ color: 'var(--text-muted)' }} />} />
        <div className="pt-3">
          <a href="/seller/profile" className="btn-ghost text-sm w-full justify-between">Edit store profile <FiChevronRight size={14} /></a>
        </div>
      </SettingSection>

      <SettingSection icon={FiShield} title="Security" description="Protect your seller account">
        <Row top label="Password" description="Reset your password from the sign-in screen"
          control={<a className="btn-ghost text-xs" href={`${SHARED_LOGIN_URL}/login/seller`}>Change <FiExternalLink size={12} /></a>} />
      </SettingSection>

      <SettingSection icon={FiGlobe} title="Store preferences" description="Regional defaults for your store">
        <Row top label="Currency" description="INR — Indian Rupee" control={null} />
        <Row top label="Timezone" description="Asia/Kolkata (IST +5:30)" control={null} />
        {account?.gstin && <Row top label="GSTIN" description={account.gstin} control={null} />}
      </SettingSection>
    </div>
  )
}
