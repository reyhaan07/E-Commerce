import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../../components/cards/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { SkeletonCard } from '../../components/Skeleton'
import { FiPackage, FiClock, FiCheckCircle, FiCalendar, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { getOrdersForPartner } from '../../api/orders'

function isToday(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getOrdersForPartner(user.id)
      .then((data) => { if (!cancelled) setOrders(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  const totalAssigned = orders.length
  const completed = orders.filter(o => o.deliveryStatus === 'Delivered')
  const pending = orders.filter(o => o.deliveryStatus !== 'Delivered')
  const todaysDeliveries = orders.filter(o =>
    o.statusHistory?.some(h => h.status === 'Delivered' && isToday(h.timestamp))
  )

  const stats = [
    { title: 'Total Assigned Orders', value: totalAssigned, icon: <FiPackage />, iconBg: 'rgba(5,150,105,0.1)', iconColor: '#059669' },
    { title: 'Pending Deliveries', value: pending.length, icon: <FiClock />, iconBg: 'rgba(217,119,6,0.1)', iconColor: '#d97706' },
    { title: 'Completed Deliveries', value: completed.length, icon: <FiCheckCircle />, iconBg: 'rgba(8,145,178,0.1)', iconColor: '#0891b2' },
    { title: "Today's Deliveries", value: todaysDeliveries.length, icon: <FiCalendar />, iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1' },
  ]

  const recent = orders.slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(s => (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value}
              icon={<span style={{ color: s.iconColor }}>{s.icon}</span>}
              iconBg={s.iconBg}
            />
          ))
        }
      </div>

      <div className="glass p-5" style={{ borderRadius: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Recent Assigned Orders</h3>
          <Link to="/delivery/orders" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            View all <FiArrowRight size={12} />
          </Link>
        </div>

        {!loading && recent.length === 0 && (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>No orders assigned yet.</p>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(o => (
              <Link
                key={o.id}
                to={`/delivery/orders/${o.id}`}
                className="flex items-center justify-between gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(5,150,105,0.03)', border: '1px solid transparent' }}
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{o.id}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{o.customerName}</div>
                </div>
                <StatusBadge status={o.deliveryStatus} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
