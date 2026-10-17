import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiX, FiTruck, FiMapPin, FiAlertTriangle, FiUsers, FiCheck, FiLoader,
} from 'react-icons/fi'
import { getEligiblePartners, assignPartner } from '../../api/orders'
import { useToast } from '../ui/Toast'

// Part B — delivery-partner assignment. The partner list is fetched already
// filtered by the backend (serviceability + active + available + PIN-near); the
// UI never sees ineligible partners and shows only Same area / Nearby area,
// never a distance (there is no GPS in this system).
export default function AssignPartnerModal({ order, onClose, onAssigned }) {
  const toast = useToast()
  const [state, setState] = useState({ loading: true })
  const [assigningId, setAssigningId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setState({ loading: true })
    getEligiblePartners(order.id)
      .then(res => { if (!cancelled) setState({ loading: false, ...res }) })
      .catch(err => { if (!cancelled) setState({ loading: false, error: err.message }) })
    return () => { cancelled = true }
  }, [order.id])

  async function assign(partner) {
    setAssigningId(partner.id)
    try {
      await assignPartner(order.id, partner.id)
      toast.success(`${order.id} assigned to ${partner.name}`)
      onAssigned?.()
      onClose()
    } catch (err) {
      toast.error(err.message)
      setAssigningId(null)
    }
  }

  const { loading, serviceable, partners = [], message, customerPincode, error } = state

  return (
    <div className="fixed inset-0 z-[85] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <motion.div className="absolute inset-0" style={{ background: 'var(--overlay)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="relative card w-full max-w-lg my-4" style={{ boxShadow: 'var(--shadow-pop)' }}
        initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ duration: 0.16 }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="soft-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><FiTruck size={18} /></div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Assign Delivery Partner</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Order <span className="font-semibold" style={{ color: 'var(--accent-ink)' }}>{order.id}</span> · {order.customerName}
              </p>
            </div>
          </div>
          <button className="btn-icon w-8 h-8" onClick={onClose}><FiX size={16} /></button>
        </div>

        {/* Delivery location line */}
        {customerPincode && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-xs" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <FiMapPin size={13} /> Delivering to PIN <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>{customerPincode}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
              <FiLoader size={22} className="animate-spin mb-3" style={{ color: 'var(--accent)' }} />
              Finding eligible partners…
            </div>
          ) : error ? (
            <Notice tint="danger" icon={<FiAlertTriangle size={20} />} title="Couldn't load partners" text={error} />
          ) : !serviceable ? (
            <Notice tint="danger" icon={<FiAlertTriangle size={20} />} title="Delivery unavailable"
              text={message || 'Delivery is currently unavailable for this location.'} />
          ) : partners.length === 0 ? (
            <Notice tint="warning" icon={<FiUsers size={20} />} title="No partners available"
              text={message || 'No delivery partners are currently available near this seller.'} />
          ) : (
            <>
              <p className="eyebrow mb-3">Available Delivery Partners · {partners.length}</p>
              <div className="space-y-2">
                {partners.map(p => {
                  const same = p.area === 'Same area'
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--success)', boxShadow: '0 0 0 3px var(--success-soft)' }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          <span className={`badge ${same ? 'badge-success' : 'badge-info'}`} style={{ fontSize: 10 }}>{p.area}</span>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          PIN {p.pincode} · {p.vehicle}{p.zone ? ` · ${p.zone}` : ''}
                        </div>
                      </div>
                      <button className="btn-primary btn-sm shrink-0" disabled={assigningId === p.id} onClick={() => assign(p)}>
                        {assigningId === p.id ? 'Assigning…' : <><FiCheck size={13} /> Assign</>}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Notice({ tint, icon, title, text }) {
  const map = {
    danger: ['var(--danger-soft)', 'var(--danger)'],
    warning: ['var(--warning-soft)', 'var(--warning)'],
  }
  const [bg, color] = map[tint] || map.warning
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="soft-icon mb-3" style={{ width: 48, height: 48, background: bg, color }}>{icon}</div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}
