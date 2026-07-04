import React, { useState } from 'react'
import { FiBell, FiShield, FiCreditCard, FiGlobe, FiChevronRight, FiAlertTriangle } from 'react-icons/fi'

function Toggle({ enabled, onToggle }) {
  return (
    <button onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{ background: enabled ? 'var(--accent)' : '#cbd5e1' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
        style={{ left: enabled ? '1.4rem' : '0.125rem', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
    </button>
  )
}

function SettingSection({ icon: Icon, title, description, children, danger }) {
  return (
    <div className="glass p-5" style={{ borderRadius: 20, border: danger ? '1px solid rgba(225,29,72,0.2)' : undefined }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: danger ? 'rgba(225,29,72,0.08)' : 'rgba(99,102,241,0.08)', color: danger ? '#e11d48' : 'var(--accent)' }}>
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

function SettingRow({ label, description, control }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="min-w-0 pr-4">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export default function Settings() {
  const [notif, setNotif] = useState({ orders: true, lowStock: true, payments: false, marketing: false })
  const [security, setSecurity] = useState({ twoFA: false, loginAlerts: true })

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="page-header">
        <div><h2 className="page-title">Settings</h2><p className="page-subtitle">Manage your account preferences</p></div>
      </div>

      <SettingSection icon={FiBell} title="Notifications" description="Control when and how you're notified">
        <SettingRow label="New Orders" description="Get notified when a new order arrives"
          control={<Toggle enabled={notif.orders} onToggle={() => setNotif(n => ({ ...n, orders: !n.orders }))} />} />
        <SettingRow label="Low Stock Alerts" description="Alert when inventory falls below threshold"
          control={<Toggle enabled={notif.lowStock} onToggle={() => setNotif(n => ({ ...n, lowStock: !n.lowStock }))} />} />
        <SettingRow label="Payment Updates" description="Notify on payment received or failed"
          control={<Toggle enabled={notif.payments} onToggle={() => setNotif(n => ({ ...n, payments: !n.payments }))} />} />
        <SettingRow label="Marketing Emails" description="Promotional tips and platform updates"
          control={<Toggle enabled={notif.marketing} onToggle={() => setNotif(n => ({ ...n, marketing: !n.marketing }))} />} />
      </SettingSection>

      <SettingSection icon={FiShield} title="Security" description="Protect your seller account">
        <SettingRow label="Two-Factor Authentication" description="Add an extra layer of security"
          control={<Toggle enabled={security.twoFA} onToggle={() => setSecurity(s => ({ ...s, twoFA: !s.twoFA }))} />} />
        <SettingRow label="Login Alerts" description="Email me on new sign-in from unknown device"
          control={<Toggle enabled={security.loginAlerts} onToggle={() => setSecurity(s => ({ ...s, loginAlerts: !s.loginAlerts }))} />} />
        <div className="pt-3">
          <button className="btn-ghost text-sm w-full justify-between">Change Password <FiChevronRight size={14} /></button>
        </div>
      </SettingSection>

      <SettingSection icon={FiCreditCard} title="Payment & Payouts" description="Manage how you get paid">
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Bank Account</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>HDFC •••• 4832</div>
          </div>
          <button className="btn-ghost text-xs">Change</button>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Payout Schedule</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Weekly — every Monday</div>
          </div>
          <button className="btn-ghost text-xs">Edit</button>
        </div>
      </SettingSection>

      <SettingSection icon={FiGlobe} title="Store Settings" description="Customize your storefront">
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Store URL</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>apexstore.sellerhub.com</div>
          </div>
          <button className="btn-ghost text-xs">Copy</button>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Currency</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>INR — Indian Rupee</div>
          </div>
          <button className="btn-ghost text-xs">Change</button>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Timezone</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Asia/Kolkata (IST +5:30)</div>
          </div>
          <button className="btn-ghost text-xs">Change</button>
        </div>
      </SettingSection>

      <SettingSection icon={FiAlertTriangle} title="Danger Zone" description="Irreversible account actions" danger>
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(225,29,72,0.12)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Deactivate Account</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Temporarily disable your seller account</div>
          </div>
          <button className="btn-ghost text-sm" style={{ color: '#d97706', borderColor: 'rgba(217,119,6,0.25)' }}>Deactivate</button>
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(225,29,72,0.12)' }}>
          <div>
            <div className="text-sm font-medium" style={{ color: '#e11d48' }}>Delete Account</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Permanently remove all your data</div>
          </div>
          <button className="btn-ghost text-sm" style={{ color: '#e11d48', borderColor: 'rgba(225,29,72,0.25)' }}>Delete</button>
        </div>
      </SettingSection>
    </div>
  )
}
