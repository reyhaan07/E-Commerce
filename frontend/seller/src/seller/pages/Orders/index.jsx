import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import FilterBar from '../../components/ui/FilterBar'
import SearchBar from '../../components/ui/SearchBar'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable } from '../../components/Skeleton'
import { useToast } from '../../components/ui/Toast'
import OrderJourney from '../../components/OrderJourney'
import {
  FiShoppingBag, FiEye, FiTruck, FiPackage, FiCheckCircle, FiThumbsUp,
  FiXCircle, FiDownload, FiX, FiAlertTriangle, FiMapPin,
} from 'react-icons/fi'
import { getOrders, updateSellerStatus, requestPickup, confirmDelivery, getOrderJourney } from '../../api/orders'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const STATUSES = ['All', 'Processing', 'Accepted', 'Packed', 'Ready For Dispatch', 'Shipped', 'Delivered', 'Cancelled', 'Rejected']

export default function Orders() {
  const { user } = useAuth()
  const toast = useToast()
  const [ordersData, setOrdersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [journey, setJourney] = useState(null)
  // The store's own delivery areas. An order whose customer PIN isn't in this
  // list can never be assigned a courier (gate 1 of serviceability), and the
  // seller previously had no way to see why from this screen.
  const [servicePins, setServicePins] = useState(null)
  const [pinBusy, setPinBusy] = useState(null)

  function loadOrders() {
    if (!user) return
    setLoading(true)
    getOrders(user.id)
      .then(async (orders) => {
        setOrdersData(orders)
        const me = await apiRequest('/users/me')
        setServicePins(me.user?.serviceablePincodes || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(loadOrders, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Gate 1: is this order's destination inside the store's delivery areas?
  // servicePins === null means we haven't loaded them yet — say nothing rather
  // than flashing a false warning.
  function pinBlocked(order) {
    if (!servicePins) return false
    const pin = String(order.customerPincode || '').trim()
    if (!/^\d{6}$/.test(pin)) return false
    return !servicePins.includes(pin)
  }

  async function addServicePin(order) {
    const pin = String(order.customerPincode || '').trim()
    setPinBusy(order.id)
    try {
      const res = await apiRequest('/users/me/serviceable-pincodes', {
        method: 'POST',
        body: JSON.stringify({ pincode: pin }),
      })
      setServicePins(res.serviceablePincodes)
      toast.success(`${pin} added to your delivery areas — this order can now be assigned a courier.`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPinBusy(null)
    }
  }

  async function runAction(orderId, action) {
    setUpdatingId(orderId)
    try { await action(); loadOrders() }
    catch (err) { toast.error(err.message || 'Could not update order') }
    finally { setUpdatingId(null) }
  }
  const handleAccept = (id) => runAction(id, () => updateSellerStatus(id, 'Accepted'))
  const handlePacked = (id) => runAction(id, () => updateSellerStatus(id, 'Packed'))
  const handleMarkReady = (id) => runAction(id, () => updateSellerStatus(id, 'Ready For Dispatch'))
  const handleRequestPickup = (id) => runAction(id, () => requestPickup(id))
  const handleConfirmDelivery = (id) => runAction(id, () => confirmDelivery(id))
  function handleReject(id) {
    const note = window.prompt('Why are you rejecting this order? The customer will see this.')
    if (note === null) return
    runAction(id, () => updateSellerStatus(id, 'Rejected', note))
  }

  function openDetail(order) {
    setDetail(order); setJourney(null)
    getOrderJourney(order.id).then(({ journey: j }) => setJourney(j)).catch(() => {})
  }
  function exportCsv() {
    const header = 'Order ID,Customer,Items,Amount,Payment,Date,Seller Status,Delivery Status,Tracking\n'
    const rows = ordersData.map(o => [o.id, `"${o.customerName}"`, o.items.length, o.amount, o.paymentMethod,
      new Date(o.createdAt).toISOString().slice(0, 10), o.sellerStatus, o.deliveryStatus || '', o.trackingId || ''].join(',')).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'shopsphere-orders.csv'; a.click(); URL.revokeObjectURL(a.href)
  }

  const counts = useMemo(() => STATUSES.reduce((acc, s) => {
    acc[s] = s === 'All' ? ordersData.length : ordersData.filter(o => o.sellerStatus === s).length
    return acc
  }, {}), [ordersData])

  const filtered = useMemo(() => ordersData.filter(o => {
    const q = query.toLowerCase()
    const matchQ = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
    return matchQ && (status === 'All' || o.sellerStatus === status)
  }), [ordersData, query, status])

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Orders" subtitle="Manage, process and track customer orders."
        actions={<button className="btn-ghost" onClick={exportCsv}><FiDownload size={15} /> Export CSV</button>} />

      {/* Status tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUSES.map(s => (
          <button key={s} className={`chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
            {s} <span className="chip-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <FilterBar><SearchBar value={query} onChange={setQuery} placeholder="Search by order ID or customer…" /></FilterBar>

      {/* Table */}
      {loading ? <SkeletonTable rows={7} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiShoppingBag />} title="No orders found" description="Try adjusting your search or status filter."
          action={(query || status !== 'All') ? <button className="btn-ghost" onClick={() => { setQuery(''); setStatus('All') }}>Clear Filters</button> : null} />
      ) : (
        <DataTable minWidth={900} columns={[
          { key: 'id', label: 'Order ID' },
          { key: 'customer', label: 'Customer' },
          { key: 'items', label: 'Items' },
          { key: 'amount', label: 'Amount' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'delivery', label: 'Delivery' },
          { key: 'action', label: 'Action', align: 'right' },
        ]}>
          {filtered.map(o => (
            <tr key={o.id}>
              <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-ink)' }}>{o.id}</span></td>
              <td className="font-medium text-[13px]" style={{ color: 'var(--text-primary)' }}>{o.customerName}</td>
              <td style={{ color: 'var(--text-muted)' }}>{o.items.length} item{o.items.length > 1 ? 's' : ''}</td>
              <td className="font-semibold tnum" style={{ color: 'var(--text-primary)' }}>₹{o.amount.toLocaleString('en-IN')}</td>
              <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              <td><StatusBadge status={o.sellerStatus} /></td>
              <td>
                <StatusBadge status={o.deliveryStatus} fallback="Not Assigned" />
                {o.deliveryPartnerName && <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{o.deliveryPartnerName}</div>}
                {!o.deliveryStatus && pinBlocked(o) && (
                  <div className="mt-1.5 flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--danger)' }}>
                      <FiAlertTriangle size={11} /> PIN {o.customerPincode} not in your delivery areas
                    </span>
                    <button
                      className="btn-ghost btn-sm"
                      disabled={pinBusy === o.id}
                      onClick={() => addServicePin(o)}
                      title={`Add ${o.customerPincode} to the PIN codes this store delivers to`}
                    >
                      <FiMapPin size={11} /> {pinBusy === o.id ? 'Adding…' : `Add ${o.customerPincode}`}
                    </button>
                  </div>
                )}
              </td>
              <td>
                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                  {o.sellerStatus === 'Processing' && (
                    <>
                      <button className="btn-ghost btn-sm" disabled={updatingId === o.id} onClick={() => handleAccept(o.id)}><FiThumbsUp size={12} /> Accept</button>
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={updatingId === o.id} onClick={() => handleReject(o.id)}><FiXCircle size={12} /> Reject</button>
                    </>
                  )}
                  {o.sellerStatus === 'Accepted' && (
                    <button className="btn-ghost btn-sm" disabled={updatingId === o.id} onClick={() => handlePacked(o.id)}><FiPackage size={12} /> Mark Packed</button>
                  )}
                  {o.sellerStatus === 'Packed' && (
                    <button className="btn-ghost btn-sm" disabled={updatingId === o.id} onClick={() => handleMarkReady(o.id)}><FiTruck size={12} /> Mark Ready</button>
                  )}
                  {/* Assigning a courier is an admin-only capability (the
                      assign endpoint is requireRole("admin")), so the seller's
                      handover ends at requesting pickup. */}
                  {o.sellerStatus === 'Ready For Dispatch' && !o.deliveryStatus && !o.pickupRequested && (
                    <button className="btn-ghost btn-sm" disabled={updatingId === o.id} onClick={() => handleRequestPickup(o.id)}><FiPackage size={12} /> Pickup</button>
                  )}
                  {o.deliveryStatus === 'Delivered' && !o.sellerConfirmedDelivery && (
                    <button className="btn-ghost btn-sm" disabled={updatingId === o.id} onClick={() => handleConfirmDelivery(o.id)}><FiCheckCircle size={12} /> Confirm</button>
                  )}
                  <button className="btn-icon w-8 h-8" title="Details" onClick={() => openDetail(o)}><FiEye size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {ordersData.length} orders</p>
      )}

      {/* Order detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'var(--overlay)' }} onClick={() => { setDetail(null); setJourney(null) }} />
          <div className="relative card p-6 w-full max-w-lg space-y-3" style={{ maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-pop)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{detail.id}</h3>
              <button className="btn-icon w-8 h-8" onClick={() => { setDetail(null); setJourney(null) }}><FiX size={16} /></button>
            </div>
            <p className="text-sm"><b>{detail.customerName}</b> · {detail.customerPhone}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{detail.customerAddress}</p>
            <div className="text-sm space-y-1">
              {detail.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between">
                    <span style={item.cancelled ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : undefined}>
                      {item.name} × {item.qty}
                    </span>
                    <span className="tnum" style={item.cancelled ? { color: 'var(--text-muted)' } : undefined}>
                      ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.cancelled && (
                    <div className="text-[11px] mt-0.5 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                      <div className="font-semibold" style={{ color: 'var(--danger)' }}>Cancelled by customer</div>
                      {item.cancellationReason && <div>Reason: {item.cancellationReason}{item.cancellationNote ? ` — ${item.cancellationNote}` : ''}</div>}
                      {item.cancelledAt && <div>Cancelled at: {new Date(item.cancelledAt).toLocaleString('en-IN')}</div>}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1.5 mt-1" style={{ borderTop: '1px solid var(--border)' }}><span>Total ({detail.paymentMethod})</span><span className="tnum">₹{detail.amount.toLocaleString('en-IN')}</span></div>
            </div>
            {detail.trackingId && <p className="text-xs font-semibold" style={{ color: 'var(--accent-ink)' }}>Tracking: {detail.trackingId} · {detail.deliveryPartnerName}</p>}
            {detail.cancellation?.requested && <p className="text-xs font-semibold" style={{ color: 'var(--warning)' }}>Cancellation {detail.cancellation.status}: {detail.cancellation.reason}</p>}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="eyebrow mb-3">Order journey</p>
              {journey ? <OrderJourney journey={journey} /> : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading timeline…</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
