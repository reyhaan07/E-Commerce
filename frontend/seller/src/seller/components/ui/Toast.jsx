import React, { createContext, useContext, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext(null)

const VARIANTS = {
  success: { Icon: FiCheckCircle, color: 'var(--success)', bg: 'var(--success-soft)', bd: 'var(--success-bd)' },
  error:   { Icon: FiAlertCircle, color: 'var(--danger)',  bg: 'var(--danger-soft)',  bd: 'var(--danger-bd)' },
  info:    { Icon: FiInfo,        color: 'var(--accent)',  bg: 'var(--accent-soft)',  bd: 'var(--border-hover)' },
}

let idSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  const push = useCallback((message, variant = 'success', ttl = 3200) => {
    const id = ++idSeq
    setToasts(t => [...t, { id, message, variant }])
    if (ttl) setTimeout(() => dismiss(id), ttl)
    return id
  }, [dismiss])

  // Convenience helpers
  const toast = {
    show: push,
    success: (m, ttl) => push(m, 'success', ttl),
    error: (m, ttl) => push(m, 'error', ttl),
    info: (m, ttl) => push(m, 'info', ttl),
    dismiss,
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        <AnimatePresence>
          {toasts.map(({ id, message, variant }) => {
            const v = VARIANTS[variant] || VARIANTS.info
            return (
              <motion.div key={id} layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface)', border: `1px solid var(--border)`, boxShadow: 'var(--shadow-lg)' }}>
                <div className="soft-icon shrink-0" style={{ width: 32, height: 32, background: v.bg, color: v.color }}>
                  <v.Icon size={17} />
                </div>
                <p className="text-sm font-medium flex-1 pt-1.5" style={{ color: 'var(--text-primary)' }}>{message}</p>
                <button className="pt-1.5 shrink-0" style={{ color: 'var(--text-faint)' }} onClick={() => dismiss(id)} aria-label="Dismiss">
                  <FiX size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Fallback no-op so components never crash if used outside the provider.
  if (!ctx) {
    return { show: () => {}, success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} }
  }
  return ctx
}
