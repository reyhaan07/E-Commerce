import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import StatusBadge from '../../components/StatusBadge'
import StatusTimeline from '../../components/StatusTimeline'
import { getOrder, updateDeliveryStatus } from '../../api/orders'

const DELIVERY_STATUSES = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered']

export default function OrderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOrder(id)
      .then((data) => { if (!cancelled) setOrder(data) })
      .catch(() => { if (!cancelled) setOrder(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function handleAdvance() {
    const currentIndex = DELIVERY_STATUSES.indexOf(order.deliveryStatus)
    const nextStatus = DELIVERY_STATUSES[currentIndex + 1]
    if (!nextStatus) return

    setAdvancing(true)
    try {
      const updated = await updateDeliveryStatus(order.id, nextStatus)
      setOrder(updated)
      if (nextStatus === 'Delivered') {
        navigate('/delivery/history')
      }
    } catch (err) {
      alert(err.message || 'Could not update status')
    } finally {
      setAdvancing(false)
    }
  }

  if (loading) {
    return <div className="skeleton h-64 w-full" />
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link to="/delivery/orders" className="btn-ghost inline-flex"><FiArrowLeft size={14} /> Back</Link>
        <p style={{ color: 'var(--text-muted)' }}>Order not found.</p>
      </div>
    )
  }

  const currentIndex = order.deliveryStatus ? DELIVERY_STATUSES.indexOf(order.deliveryStatus) : -1
  const nextStatus = DELIVERY_STATUSES[currentIndex + 1]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <Link to="/delivery/orders" className="btn-ghost inline-flex mb-3"><FiArrowLeft size={14} /> Back to Orders</Link>
          <h1 className="page-title">{order.id}</h1>
          <p className="page-subtitle">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <StatusBadge status={order.deliveryStatus} />
      </div>

      <div className="glass p-5" style={{ borderRadius: 20 }}>
        <h3 className="section-title">Delivery Progress</h3>
        <StatusTimeline currentStatus={order.deliveryStatus} statusHistory={order.statusHistory} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <h3 className="section-title">Customer</h3>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{order.customerName}</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{order.customerEmail}</p>
        </div>
        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <h3 className="section-title">Items</h3>
          <ul className="text-sm space-y-1" style={{ color: 'var(--text-soft)' }}>
            {order.items.map((item, i) => (
              <li key={i}>{item.name} × {item.qty}</li>
            ))}
          </ul>
          <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>Total: ₹{order.amount}</p>
        </div>
      </div>

      {nextStatus && (
        <div className="glass p-5 flex items-center justify-between gap-4 flex-col sm:flex-row" style={{ borderRadius: 20 }}>
          <div>
            <h3 className="section-title mb-0">Advance Status</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Mark this order as "{nextStatus}"</p>
          </div>
          <button className="btn-primary" onClick={handleAdvance} disabled={advancing}>
            <FiCheckCircle size={16} /> {advancing ? 'Updating...' : `Mark as ${nextStatus}`}
          </button>
        </div>
      )}
    </div>
  )
}
