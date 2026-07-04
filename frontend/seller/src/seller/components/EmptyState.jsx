import React from 'react'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon" style={{ color: 'var(--accent)' }}>{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
