import React from 'react'

// Thin structural wrapper for a consistent table shell: horizontal-scroll
// container, styled header from `columns`, and caller-provided <tr> rows as
// children. Pages keep full control of their (often bespoke) cells while the
// chrome stays identical everywhere.
//   columns: [{ key, label, align?, className?, hideBelow? }]
export default function DataTable({ columns = [], children, minWidth = 640, className = '' }) {
  return (
    <div className={`table-wrapper ${className}`}>
      <table className="data-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key || c.label}
                className={`${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.className || ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
