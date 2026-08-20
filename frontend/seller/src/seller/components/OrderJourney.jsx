import React from 'react'
import { FiCheck, FiClock, FiSlash } from 'react-icons/fi'

// Vertical rendering of the end-to-end order journey. The steps and their
// state come from the backend (GET /api/orders/:id → journey), so this view
// and the buyer's tracking page can never disagree about where an order is.

const PHASE_LABEL = {
  order: 'Order',
  seller: 'You',
  delivery: 'Courier',
}

const ACTOR_LABEL = {
  system: 'automatic',
  user: 'customer',
  seller: 'you',
  admin: 'admin',
  delivery: 'courier',
}

function Marker({ state }) {
  const base = 'relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0'
  if (state === 'done') {
    return (
      <div className={base} style={{ background: 'var(--accent)', color: '#fff' }}>
        <FiCheck size={14} />
      </div>
    )
  }
  if (state === 'current') {
    return (
      <div className={base} style={{ background: 'var(--surface)', border: '2px solid var(--accent)', color: 'var(--accent)' }}>
        <FiClock size={13} />
      </div>
    )
  }
  if (state === 'halted') {
    return (
      <div className={base} style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
        <FiSlash size={13} />
      </div>
    )
  }
  return <div className={base} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }} />
}

export default function OrderJourney({ journey }) {
  if (!journey?.steps?.length) return null

  return (
    <div className="space-y-1">
      {journey.halted && (
        <p className="text-xs font-semibold mb-2" style={{ color: '#d97706' }}>
          This order stopped at “{journey.haltedReason}” — the remaining steps won’t happen.
        </p>
      )}

      {journey.steps.map((step, i) => {
        const last = i === journey.steps.length - 1
        const muted = step.state === 'upcoming' || step.state === 'halted'
        return (
          <div key={`${step.phase}-${step.key}`} className="flex gap-3">
            {/* marker + connector */}
            <div className="flex flex-col items-center">
              <Marker state={step.state} />
              {!last && (
                <div
                  className="w-0.5 flex-1 my-1"
                  style={{ background: step.state === 'done' ? 'var(--accent)' : 'var(--border)', minHeight: 18 }}
                />
              )}
            </div>

            {/* copy */}
            <div className={`pb-3 min-w-0 ${last ? '' : 'flex-1'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-semibold"
                  style={{ color: muted ? 'var(--text-muted)' : 'var(--text-primary)' }}
                >
                  {step.label}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
                >
                  {PHASE_LABEL[step.phase] || step.phase}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {step.description}
              </p>
              {step.timestamp && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(step.timestamp).toLocaleString()}
                  {step.actor && ACTOR_LABEL[step.actor] ? ` · ${ACTOR_LABEL[step.actor]}` : ''}
                </p>
              )}
              {step.note && (
                <p className="text-[11px] mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>
                  “{step.note}”
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
