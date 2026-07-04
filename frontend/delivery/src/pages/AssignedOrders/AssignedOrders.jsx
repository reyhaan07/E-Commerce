import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiEye } from 'react-icons/fi'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable } from '../../components/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { getOrdersForPartner } from '../../api/orders'

const FILTERS = ['All', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery']

export default function AssignedOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    let cancelled = false
    getOrdersForPartner(user.id)
      .then((data) => { if (!cancelled) setOrders(data.filter(o => o.deliveryStatus !== 'Delivered')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user.id])

  const filtered = filter === 'All' ? orders : orders.filter(o => o.deliveryStatus === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Orders</h1>
          <p className="page-subtitle">Orders assigned to you that are not yet delivered</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input w-full sm:w-56"
        >
          {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FiPackage />}
          title="No orders here"
          description="You don't have any assigned orders matching this filter."
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>₹{o.amount}</td>
                  <td><StatusBadge status={o.deliveryStatus} /></td>
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
