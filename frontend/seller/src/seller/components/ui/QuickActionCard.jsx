import React from 'react'

// A single quick-action tile: tinted icon + label. `active` gives the dashed
// highlighted treatment seen in the reference.
export default function QuickActionCard({ icon: Icon, label, onClick, active = false }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2.5 px-3 h-[52px] rounded-xl text-left transition-all duration-150 w-full"
      style={active
        ? { background: 'var(--accent-softer)', border: '1px dashed var(--border-hover)' }
        : { background: 'var(--surface)', border: '1px solid var(--border)' }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--surface-2)' } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' } }}>
      <span className="soft-icon" style={{ width: 34, height: 34, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
        <Icon size={16} />
      </span>
      <span className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</span>
    </button>
  )
}
