import React from 'react'
import { FiUser, FiMail } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your delivery partner account details</p>
        </div>
      </div>

      <div className="glass p-6 max-w-lg" style={{ borderRadius: 20 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #059669, #047857)', color: 'white' }}>
            {user?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Delivery Partner</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <FiUser style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-soft)' }}>{user?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FiMail style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--text-soft)' }}>{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
