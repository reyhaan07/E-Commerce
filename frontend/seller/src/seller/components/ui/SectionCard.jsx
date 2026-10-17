import React from 'react'

// A titled content card: tinted icon + title + optional description on the
// header row, an optional right-aligned action, then the body.
export default function SectionCard({
  icon, iconTint = 'indigo', title, description, action, className = '', bodyClassName = '', children,
}) {
  const TINTS = {
    indigo: ['var(--accent-soft)', 'var(--accent)'],
    green:  ['var(--success-soft)', 'var(--success)'],
    orange: ['var(--warning-soft)', 'var(--warning)'],
    blue:   ['var(--info-soft)', 'var(--info)'],
    violet: ['var(--violet-soft)', 'var(--violet)'],
    amber:  ['var(--amber-soft)', 'var(--amber)'],
  }
  const [bg, color] = TINTS[iconTint] || TINTS.indigo

  return (
    <section className={`card p-5 ${className}`}>
      {(title || icon || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="soft-icon" style={{ background: bg, color }}>{icon}</div>}
            <div className="min-w-0">
              {title && <h3 className="section-title truncate">{title}</h3>}
              {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
