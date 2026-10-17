import React from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

// Client-side pagination footer: "Showing X to Y of N" + page buttons +
// rows-per-page selector. Purely presentational — the parent owns page state.
export default function Pagination({
  page, pageSize, total, onPage, onPageSize,
  pageSizeOptions = [10, 25, 50], noun = 'items',
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  // Compact window of page numbers around the current page.
  const window = []
  const start = Math.max(1, Math.min(page - 1, pages - 2))
  for (let p = start; p <= Math.min(pages, start + 2); p++) window.push(p)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Showing <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>{from}</span>–
        <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>{to}</span> of{' '}
        <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>{total}</span> {noun}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button className="btn-icon w-8 h-8" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <FiChevronLeft size={15} />
          </button>
          {start > 1 && <span className="text-xs px-1" style={{ color: 'var(--text-faint)' }}>…</span>}
          {window.map(p => (
            <button key={p} onClick={() => onPage(p)}
              className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={p === page
                ? { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' }
                : { background: 'var(--surface)', color: 'var(--text-soft)', border: '1px solid var(--border)' }}>
              {p}
            </button>
          ))}
          {start + 2 < pages && <span className="text-xs px-1" style={{ color: 'var(--text-faint)' }}>…</span>}
          <button className="btn-icon w-8 h-8" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
            <FiChevronRight size={15} />
          </button>
        </div>

        {onPageSize && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rows</span>
            <select className="input h-8 w-16 text-xs px-2" value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}>
              {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
