import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_BASE = 'http://localhost:5000/api'
const LOGIN_URL = 'http://localhost:5177'
const STORAGE_KEY = 'delivery_user'
const EXPECTED_ROLE = 'delivery'

const timelineSteps = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out For Delivery', 'Delivered']

function statusIndex(status) {
  return Math.max(0, timelineSteps.indexOf(status))
}

function consumeAuthHandoff() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('authId')
  const role = params.get('authRole')
  if (!id || role !== EXPECTED_ROLE) return null

  const user = {
    id,
    role,
    name: params.get('authName') || 'Delivery Partner',
    email: params.get('authEmail') || '',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

  params.delete('authId')
  params.delete('authName')
  params.delete('authEmail')
  params.delete('authRole')
  const query = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
  return user
}

function getStoredUser() {
  const handoff = consumeAuthHandoff()
  if (handoff) return handoff
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function App() {
  const [user, setUser] = useState(getStoredUser)
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [lastSynced, setLastSynced] = useState(new Date())

  useEffect(() => {
    if (!user) {
      window.location.href = `${LOGIN_URL}?role=delivery&redirect=${encodeURIComponent(window.location.href)}`
    }
  }, [user])

  const loadOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/orders`)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load orders')

      const assignedOrders = result.orders.filter((order) => {
        const hasDeliveryWork = Boolean(order.deliveryStatus || order.deliveryPartnerId)
        if (!hasDeliveryWork) return false
        if (user.id === 'delivery-demo') return true
        return order.deliveryPartnerId === user.id
      })

      setOrders(assignedOrders)
      setSelectedId((current) => current && assignedOrders.some((order) => order.id === current) ? current : assignedOrders[0]?.id || '')
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message || 'Unable to load delivery orders')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadOrders() }, [loadOrders])

  const selectedOrder = orders.find((order) => order.id === selectedId) || orders[0]

  const metrics = useMemo(() => {
    const completed = orders.filter((order) => order.deliveryStatus === 'Delivered').length
    return [
      { label: 'Assigned Orders', value: orders.length, detail: 'Loaded from MongoDB', icon: '??' },
      { label: 'Pending', value: orders.length - completed, detail: 'Needs delivery action', icon: '??' },
      { label: 'Delivered', value: completed, detail: 'Completed orders', icon: '?' },
    ]
  }, [orders])

  const filteredOrders = orders.filter((order) => {
    const text = `${order.id} ${order.customerName} ${order.sellerName} ${order.deliveryStatus} ${order.customerAddress}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  const updateStatus = async (order, nextStatus) => {
    setError('')
    try {
      const response = await fetch(`${API_BASE}/orders/${order.id}/delivery-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryStatus: nextStatus }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update status')
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item))
      setLastSynced(new Date())
    } catch (err) {
      setError(err.message || 'Unable to update delivery status')
    }
  }

  const advanceStatus = (order) => {
    const next = timelineSteps[statusIndex(order.deliveryStatus) + 1]
    if (next) updateStatus(order, next)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const openMaps = (address) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`, '_blank')
  const callNumber = (phone) => { if (phone) window.location.href = `tel:${String(phone).replace(/\s/g, '')}` }

  if (!user) return <main className="app"><div className="loading">Redirecting to login...</div></main>
  if (loading) return <main className="app"><div className="loading">Loading delivery orders from MongoDB...</div></main>

  return (
    <main className="app">
      <section className="shell">
        <header className="header">
          <div>
            <p className="eyebrow">ShopSphere delivery console</p>
            <h1>Partner Operations</h1>
            <p className="muted">Signed in as {user.name}. Orders and status updates are connected to the backend MongoDB.</p>
          </div>
          <div className="stack">
            <button className="top-button primary" onClick={loadOrders}>Refresh orders</button>
            <button className="top-button" onClick={logout}>Logout</button>
            <p className="muted">Last sync: {lastSynced.toLocaleTimeString()}</p>
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="grid">
          <aside className="stack">
            <section className="metrics">
              {metrics.map((metric) => (
                <article className="metric" key={metric.label}>
                  <div className="row"><span className="eyebrow">{metric.label}</span><span>{metric.icon}</span></div>
                  <strong>{metric.value}</strong>
                  <p className="muted">{metric.detail}</p>
                </article>
              ))}
            </section>

            <section className="panel">
              <div className="row"><h2>Assigned Orders</h2><span>??</span></div>
              <input className="search" placeholder="Search order, customer, status" value={query} onChange={(event) => setQuery(event.target.value)} />
              <div className="stack" style={{ marginTop: 14 }}>
                {filteredOrders.length === 0 ? <p className="muted">No delivery orders found.</p> : filteredOrders.map((order) => (
                  <button key={order.id} className={`order-button ${selectedOrder?.id === order.id ? 'active' : ''}`} onClick={() => setSelectedId(order.id)}>
                    <div className="row"><strong>{order.id}</strong><StatusPill status={order.deliveryStatus} /></div>
                    <p style={{ marginTop: 8 }}>{order.customerName}</p>
                    <p className="muted">{order.sellerName}</p>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          {selectedOrder ? (
            <section className="stack">
              <article className="card details">
                <div className="row">
                  <div>
                    <p className="eyebrow">Assigned order details</p>
                    <h2>{selectedOrder.id}</h2>
                  </div>
                  <StatusPill status={selectedOrder.deliveryStatus} large />
                </div>

                <div className="info-grid">
                  <Info label="Customer" value={selectedOrder.customerName} />
                  <Info label="Customer Phone" value={selectedOrder.customerPhone || 'Not available'} />
                  <Info label="Customer Address" value={selectedOrder.customerAddress || 'Not available'} />
                  <Info label="Seller" value={selectedOrder.sellerName || 'Not available'} />
                  <Info label="Seller Address" value={selectedOrder.sellerAddress || 'Not available'} />
                  <Info label="Items" value={(selectedOrder.items || []).map((item) => `${item.name} x${item.qty}`).join(', ') || 'No items'} />
                  <Info label="Amount" value={formatMoney(selectedOrder.amount)} />
                  <Info label="Payment" value={selectedOrder.paymentMethod || 'Not available'} />
                </div>
              </article>

              <Timeline status={selectedOrder.deliveryStatus} />

              <section className="actions">
                <ActionPanel title="Pickup Process" icon="??" actions={[
                  { label: 'View Seller Details', icon: '??', onClick: () => setDialog({ title: 'Seller Details', rows: sellerRows(selectedOrder) }) },
                  { label: 'Navigate to Seller', icon: '??', onClick: () => openMaps(selectedOrder.sellerAddress) },
                  { label: 'Mark Accepted', icon: '?', primary: selectedOrder.deliveryStatus === 'Assigned', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Accepted') },
                  { label: 'Mark Picked Up', icon: '??', primary: selectedOrder.deliveryStatus === 'Accepted', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Picked Up') || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Picked Up') },
                ]} />
                <ActionPanel title="Delivery Process" icon="??" actions={[
                  { label: 'View Customer Details', icon: '??', onClick: () => setDialog({ title: 'Customer Details', rows: customerRows(selectedOrder) }) },
                  { label: 'Navigate to Customer', icon: '??', onClick: () => openMaps(selectedOrder.customerAddress) },
                  { label: 'Call Customer', icon: '??', onClick: () => callNumber(selectedOrder.customerPhone) },
                  { label: 'Advance Status', icon: '??', primary: selectedOrder.deliveryStatus !== 'Delivered', disabled: selectedOrder.deliveryStatus === 'Delivered', onClick: () => advanceStatus(selectedOrder) },
                  { label: 'Mark Delivered', icon: '?', primary: selectedOrder.deliveryStatus === 'Out For Delivery', disabled: selectedOrder.deliveryStatus === 'Delivered' || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Out For Delivery'), onClick: () => updateStatus(selectedOrder, 'Delivered') },
                ]} />
              </section>
            </section>
          ) : <section className="card details"><p>No assigned orders yet.</p></section>}

          <aside className="stack">
            <section className="panel">
              <h2>Route Contacts</h2>
              {selectedOrder ? <div className="stack" style={{ marginTop: 14 }}>
                <Info label="Seller" value={`${selectedOrder.sellerName || '-'} - ${selectedOrder.sellerAddress || '-'}`} />
                <Info label="Customer" value={`${selectedOrder.customerName || '-'} - ${selectedOrder.customerAddress || '-'}`} />
                <Info label="Delivery Partner" value={`${selectedOrder.deliveryPartnerName || user.name} - ${selectedOrder.deliveryPartnerPhone || '-'}`} />
              </div> : <p className="muted">No order selected.</p>}
            </section>
            <section className="panel">
              <h2>Latest Activity</h2>
              <div className="stack" style={{ marginTop: 14 }}>
                {(selectedOrder?.statusHistory || []).slice().reverse().map((item, index) => (
                  <div className="note" key={`${item.status}-${item.timestamp}-${index}`}>
                    <strong>{item.status}</strong>
                    <p className="muted">{formatDate(item.timestamp)}</p>
                  </div>
                ))}
                {(!selectedOrder?.statusHistory || selectedOrder.statusHistory.length === 0) && <p className="muted">No status history yet.</p>}
              </div>
            </section>
          </aside>
        </section>
      </section>

      {dialog && <Dialog dialog={dialog} close={() => setDialog(null)} />}
    </main>
  )
}

function sellerRows(order) {
  return [
    ['Seller', order.sellerName],
    ['Address', order.sellerAddress],
    ['Phone', order.sellerPhone],
    ['Order', order.id],
  ]
}

function customerRows(order) {
  return [
    ['Customer', order.customerName],
    ['Address', order.customerAddress],
    ['Phone', order.customerPhone],
    ['Email', order.customerEmail],
  ]
}

function StatusPill({ status, large = false }) {
  const done = status === 'Delivered'
  const active = ['Picked Up', 'In Transit', 'Out For Delivery'].includes(status)
  return <span className={`status ${done ? 'done' : active ? 'active' : ''}`} style={large ? { padding: '8px 12px' } : null}>{status || 'Unassigned'}</span>
}

function Info({ label, value }) {
  return <div className="info"><span>{label}</span><p>{value || 'Not available'}</p></div>
}

function Timeline({ status }) {
  const current = statusIndex(status)
  return <section className="card details"><p className="eyebrow">Order tracking</p><h2>Customer-visible timeline</h2><div className="timeline">{timelineSteps.map((step, index) => <div key={step} className={`step ${index <= current ? 'done' : ''}`}><div className="step-number">{index + 1}</div><strong>{step}</strong>{index === current && <p className="muted">Current</p>}</div>)}</div></section>
}

function ActionPanel({ title, icon, actions }) {
  return <section className="panel"><div className="row"><h2>{title}</h2><span>{icon}</span></div><div className="action-list">{actions.map((action) => <button key={action.label} className={action.primary ? 'primary' : ''} disabled={action.disabled} onClick={action.onClick}><span>{action.label}</span> <span>{action.icon}</span></button>)}</div></section>
}

function Dialog({ dialog, close }) {
  return <div className="dialog-backdrop" onClick={close}><section className="dialog" onClick={(event) => event.stopPropagation()}><div className="row"><div><p className="eyebrow">Details</p><h2>{dialog.title}</h2></div><button className="top-button" onClick={close}>?</button></div><div className="stack" style={{ marginTop: 16 }}>{dialog.rows.map(([label, value]) => <Info key={label} label={label} value={value} />)}</div></section></div>
}

createRoot(document.getElementById('root')).render(<App />)
