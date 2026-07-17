import React, { useState, useEffect } from 'react'
import { SkeletonTable } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { FiShoppingBag, FiSearch, FiEye, FiTruck, FiPackage, FiCheckCircle } from 'react-icons/fi'
import { getOrders, updateSellerStatus, requestPickup, confirmDelivery } from '../../api/orders'
import { useAuth } from '../../hooks/useAuth'

const STATUSES = ['All', 'Processing', 'Ready For Dispatch', 'Shipped', 'Delivered', 'Returned', 'Cancelled']
const statusClass = {
  Processing: 'badge-info',
  'Ready For Dispatch': 'badge-warning',
  Shipped: 'badge-accent',
  Delivered: 'badge-success',
  Returned: 'badge-danger',
  Cancelled: 'badge-neutral',
}

export default function Orders() {
  const { user } = useAuth()
  const [ordersData, setOrdersData] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [status,  setStatus]  = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [detail, setDetail] = useState(null)

  function loadOrders() {
    if (!user) return
    setLoading(true)
    getOrders(user.id)
      .then(async (orders) => {
        setOrdersData(orders)
        // returns that belong to this seller's orders
        const { apiRequest } = await import('../../api/client')
        const ret = await apiRequest('/returns')
        const ownIds = new Set(orders.map(o => o.id))
        setReturns(ret.returns.filter(r => ownIds.has(r.orderId)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(loadOrders, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function runAction(orderId, action) {
    setUpdatingId(orderId)
    try {
      await action()
      loadOrders()
    } catch (err) {
      alert(err.message || 'Could not update order')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleMarkReady = (orderId) => runAction(orderId, () => updateSellerStatus(orderId, 'Ready For Dispatch'))
  const handleRequestPickup = (orderId) => runAction(orderId, () => requestPickup(orderId))
  const handleConfirmDelivery = (orderId) => runAction(orderId, () => confirmDelivery(orderId))

  async function returnAction(ret, path, body) {
    const { apiRequest } = await import('../../api/client')
    try {
      await apiRequest(`/returns/${ret.id}/${path}`, { method: 'PATCH', body: JSON.stringify(body) })
      loadOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  function exportCsv() {
    const header = 'Order ID,Customer,Items,Amount,Payment,Date,Seller Status,Delivery Status,Tracking\n'
    const rows = ordersData.map(o => [
      o.id, `"${o.customerName}"`, o.items.length, o.amount, o.paymentMethod,
      new Date(o.createdAt).toISOString().slice(0, 10), o.sellerStatus, o.deliveryStatus || '', o.trackingId || '',
    ].join(',')).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'shopsphere-orders.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const filtered = ordersData.filter(o => {
    const matchQ = o.id.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase())
    const matchS = status === 'All' || o.sellerStatus === status
    return matchQ && matchS
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'All' ? ordersData.length : ordersData.filter(o => o.sellerStatus === s).length
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="page-subtitle">{ordersData.length} total orders</p>
        </div>
        <button className="btn-ghost" onClick={exportCsv}>Export CSV</button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button key={s}
            className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: status === s ? 'rgba(99,102,241,0.1)' : 'white',
              color: status === s ? 'var(--accent)' : 'var(--text-muted)',
              border: status === s ? '1px solid rgba(99,102,241,0.25)' : '1px solid var(--border)',
              fontWeight: status === s ? 600 : 500,
              boxShadow: status === s ? '0 2px 8px rgba(99,102,241,0.1)' : 'var(--shadow-sm)',
            }}
            onClick={() => setStatus(s)}>
            {s}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: '#f1f5f9', color: 'var(--text-muted)' }}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="glass p-3 flex items-center gap-3" style={{ borderRadius: 16 }}>
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by order ID or customer…" className="input pl-9 h-9 text-sm"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={7} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiShoppingBag />} title="No orders found" description="Try adjusting your search or status filter."
          action={<button className="btn-ghost" onClick={() => { setQuery(''); setStatus('All') }}>Clear Filters</button>} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Status</th><th>Delivery</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>{o.id}</span></td>
                  <td>{o.customerName}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{o.items.length} item{o.items.length > 1 ? 's' : ''}</td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>₹{o.amount}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td><span className={`badge ${statusClass[o.sellerStatus] || 'badge-neutral'}`}>{o.sellerStatus}</span></td>
                  <td>
                    <StatusBadge status={o.deliveryStatus} />
                    {o.deliveryPartnerName && (
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{o.deliveryPartnerName}</div>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {o.sellerStatus === 'Processing' && (
                        <button className="btn-ghost text-xs" style={{ padding: '6px 10px' }} disabled={updatingId === o.id} onClick={() => handleMarkReady(o.id)}>
                          <FiTruck size={12} /> {updatingId === o.id ? 'Updating…' : 'Ready For Dispatch'}
                        </button>
                      )}
                      {o.sellerStatus === 'Ready For Dispatch' && !o.pickupRequested && (
                        <button className="btn-ghost text-xs" style={{ padding: '6px 10px' }} disabled={updatingId === o.id} onClick={() => handleRequestPickup(o.id)}>
                          <FiPackage size={12} /> {updatingId === o.id ? 'Updating…' : 'Request Pickup'}
                        </button>
                      )}
                      {o.sellerStatus === 'Ready For Dispatch' && o.pickupRequested && !o.deliveryStatus && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Awaiting partner…</span>
                      )}
                      {o.deliveryStatus === 'Delivered' && !o.sellerConfirmedDelivery && (
                        <button className="btn-ghost text-xs" style={{ padding: '6px 10px' }} disabled={updatingId === o.id} onClick={() => handleConfirmDelivery(o.id)}>
                          <FiCheckCircle size={12} /> {updatingId === o.id ? 'Updating…' : 'Confirm Delivery'}
                        </button>
                      )}
                      <button className="btn-icon" title="Details" style={{ width: 30, height: 30 }} onClick={() => setDetail(o)}><FiEye size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {ordersData.length} orders
        </div>
      )}

      {/* Returns needing seller action (Feature 11) */}
      {returns.length > 0 && (
        <div className="glass p-5 space-y-3" style={{ borderRadius: 20 }}>
          <h3 className="font-semibold">Returns on Your Orders</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Return</th><th>Order</th><th>Item</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>{r.id}</span></td>
                    <td className="text-xs">{r.orderId}</td>
                    <td className="text-xs max-w-[160px] truncate">{r.items[0]?.name}</td>
                    <td className="text-xs max-w-[160px] truncate">{r.reason}</td>
                    <td><span className="badge badge-info">{r.status}</span></td>
                    <td>
                      {r.status === 'Admin Review' && (
                        <button className="btn-ghost text-xs" style={{ padding: '6px 10px' }} onClick={() => returnAction(r, 'status', { status: 'Seller Approved' })}>Approve Return</button>
                      )}
                      {r.status === 'Under Inspection' && (
                        <div className="flex items-center gap-1.5">
                          <button className="btn-ghost text-xs" style={{ padding: '6px 10px' }} onClick={() => returnAction(r, 'inspect', { result: 'Pass', note: 'Verified in good condition' })}>Pass</button>
                          <button className="btn-ghost text-xs" style={{ padding: '6px 10px', color: '#e11d48' }} onClick={() => returnAction(r, 'inspect', { result: 'Fail', note: 'Item damaged or used' })}>Fail</button>
                        </div>
                      )}
                      {!['Admin Review', 'Under Inspection'].includes(r.status) && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No action needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)} />
          <div className="relative glass p-6 w-full max-w-lg space-y-3" style={{ borderRadius: 20, background: 'white', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{detail.id}</h3>
              <button className="btn-ghost text-xs" onClick={() => setDetail(null)}>Close</button>
            </div>
            <p className="text-sm"><b>{detail.customerName}</b> · {detail.customerPhone}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{detail.customerAddress}</p>
            <div className="text-sm space-y-1">
              {detail.items.map((item, idx) => (
                <div key={idx} className="flex justify-between"><span>{item.name} × {item.qty}</span><span>₹{item.price * item.qty}</span></div>
              ))}
              <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid var(--border)' }}><span>Total ({detail.paymentMethod})</span><span>₹{detail.amount}</span></div>
            </div>
            {detail.trackingId && <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Tracking: {detail.trackingId} · {detail.deliveryPartnerName}</p>}
            {detail.cancellation?.requested && (
              <p className="text-xs font-semibold" style={{ color: '#d97706' }}>Cancellation {detail.cancellation.status}: {detail.cancellation.reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
