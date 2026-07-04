import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiEye } from 'react-icons/fi'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable } from '../../components/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { getOrdersForPartner } from '../../api/orders'

export default function History() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getOrdersForPartner(user.id)
      .then((data) => { if (!cancelled) setOrders(data.filter(o => o.deliveryStatus === 'Delivered')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  function deliveredAt(order) {
    const entry = order.statusHistory?.find(h => h.status === 'Delivered')
    return entry ? new Date(entry.timestamp).toLocaleString() : '—'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Delivery History</h1>
          <p className="page-subtitle">Orders you have successfully delivered</p>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FiCheckCircle />}
          title="No deliveries yet"
          description="Completed deliveries will show up here."
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Delivered On</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>₹{o.amount}</td>
                  <td>{deliveredAt(o)}</td>
                  <td>
                    <Link to={`/delivery/orders/${o.id}`} className="btn-ghost">
                      <FiEye size={14} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
