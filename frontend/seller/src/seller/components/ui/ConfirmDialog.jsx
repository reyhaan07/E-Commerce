import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiAlertTriangle } from 'react-icons/fi'

// Accessible confirmation modal — a styled replacement for window.confirm.
// Controlled: render with `open` and supply onConfirm / onCancel.
export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = true, busy = false, icon, onConfirm, onCancel,
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0" style={{ background: 'var(--overlay)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={busy ? undefined : onCancel} />
          <motion.div role="dialog" aria-modal="true"
            className="relative card p-6 w-full max-w-sm"
            style={{ boxShadow: 'var(--shadow-pop)' }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.16 }}>
            <div className="soft-icon mb-4" style={{ width: 44, height: 44,
              background: destructive ? 'var(--danger-soft)' : 'var(--accent-soft)',
              color: destructive ? 'var(--danger)' : 'var(--accent)' }}>
              {icon || <FiAlertTriangle size={20} />}
            </div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {message && <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>{message}</p>}
            <div className="flex items-center justify-end gap-2 mt-5">
              <button className="btn-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
              <button className={destructive ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
