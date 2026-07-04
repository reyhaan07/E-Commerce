import React from 'react'

export default function StatCard({ title, value, icon, iconBg, subtitle }) {
  return (
    <div className="stat-card animate-fade-in group">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <p className="text-2xl font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
      <div
        className="stat-icon shrink-0 text-xl transition-transform duration-300 group-hover:scale-110"
        style={{ background: iconBg || 'rgba(5,150,105,0.1)' }}
      >
        {icon}
      </div>
    </div>
  )
}
