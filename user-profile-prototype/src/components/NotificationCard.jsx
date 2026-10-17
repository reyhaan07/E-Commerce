import React from 'react'
import { FiCheck, FiMail, FiMessageSquare } from 'react-icons/fi'

// A single selectable notification-preference card (checkbox styling).
export default function NotificationCard({ type, title, description, checked, onToggle, disabled }) {
  const Icon = type === 'sms' ? FiMessageSquare : FiMail
  return (
    <button
      type="button"
      className={`notif${checked ? ' on' : ''}`}
      onClick={() => !disabled && onToggle(!checked)}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span className="check">{checked && <FiCheck size={14} strokeWidth={3} />}</span>
      <span>
        <span className="n-title"><Icon size={15} /> {title}</span>
        <span className="n-desc">{description}</span>
      </span>
    </button>
  )
}
