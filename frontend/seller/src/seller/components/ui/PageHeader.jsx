import React from 'react'

// Standard page heading: title + subtitle on the left, actions on the right.
export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions || children}</div>
      )}
    </div>
  )
}
