import React from 'react'

// 6-step delivery progress tracker. `statusHistory` is the order's
// [{status, timestamp}] array from the backend; `currentStatus` is
// order.deliveryStatus (null before a delivery partner is assigned).
const STEPS = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered']

export default function StatusTimeline({ currentStatus, statusHistory = [] }) {
  const currentIndex = currentStatus ? STEPS.indexOf(currentStatus) : -1

  function timestampFor(step) {
    const entry = statusHistory.find((h) => h.status === step)
    return entry ? new Date(entry.timestamp).toLocaleString() : null
  }

  return (
    <div className="status-track">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''
        const time = timestampFor(step)
        return (
          <div key={step} className={`status-step ${state}`}>
            <div className="status-step-line" />
            <div className="status-step-dot">{i < currentIndex ? '✓' : i + 1}</div>
            <div className="status-step-label">{step}</div>
            {time && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{time}</div>}
          </div>
        )
      })}
    </div>
  )
}
