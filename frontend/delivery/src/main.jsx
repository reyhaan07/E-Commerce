import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { io } from 'socket.io-client'
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
    token: params.get('authToken') || null,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

  params.delete('authId')
  params.delete('authName')
  params.delete('authEmail')
  params.delete('authRole')
  params.delete('authToken')
  const query = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash)
  return user
}

function getStoredUser() {
  const handoff = consumeAuthHandoff()
  if (handoff) return handoff
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

function authHeaders() {
  try {
    const token = JSON.parse(localStorage.getItem(STORAGE_KEY))?.token
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
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
  const [tab, setTab] = useState('console') // console | history | profile
  const [orders, setOrders] = useState([])
  const [returnPickups, setReturnPickups] = useState([])
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

      // reverse pickups for returns assigned to this partner (Feature 11)
      const returnsResponse = await fetch(`${API_BASE}/returns`, { headers: authHeaders() })
      const returnsResult = await returnsResponse.json()
      if (returnsResponse.ok && returnsResult.success) {
        setReturnPickups(returnsResult.returns.filter((ret) => ['Pickup Scheduled', 'Picked Up'].includes(ret.status)))
      }

      setLastSynced(new Date())
    } catch (err) {
      setError(err.message || 'Unable to load delivery orders')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadOrders() }, [loadOrders])

  // live refresh when the admin assigns work or a return moves
  useEffect(() => {
    if (!user) return
    const socket = io('http://localhost:5000', { query: { role: 'delivery', userId: user.id } })
    socket.on('delivery-assigned', loadOrders)
    socket.on('order-updated', loadOrders)
    socket.on('return-updated', loadOrders)
    return () => socket.disconnect()
  }, [user, loadOrders])

  const advanceReturn = async (ret, nextStatus) => {
    setError('')
    try {
      const response = await fetch(`${API_BASE}/returns/${ret.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to update return')
      loadOrders()
    } catch (err) {
      setError(err.message)
    }
  }

  const selectedOrder = orders.find((order) => order.id === selectedId) || orders[0]

  const metrics = useMemo(() => {
    const completed = orders.filter((order) => order.deliveryStatus === 'Delivered').length
    return [
      { label: 'Assigned Orders', value: orders.length, detail: 'Loaded from MongoDB', icon: '📦' },
      { label: 'Pending', value: orders.length - completed, detail: 'Needs delivery action', icon: '📦' },
      { label: 'Delivered', value: completed, detail: 'Completed orders', icon: '✅' },
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

        <div className="tabs">
          <button className={`tab ${tab === 'console' ? 'active' : ''}`} onClick={() => setTab('console')}>🚚 Console</button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>🗂️ History</button>
          <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>👤 Profile</button>
        </div>

        {error && tab === 'console' && <div className="error">{error}</div>}

        {tab === 'history' && <HistoryView user={user} />}
        {tab === 'profile' && <ProfileView user={user} onNameChange={(name) => setUser((u) => ({ ...u, name }))} />}

        {tab === 'console' && <section className="grid">
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
              <div className="row"><h2>Assigned Orders</h2><span>🚚</span></div>
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
                <ActionPanel title="Pickup Process" icon="📦" actions={[
                  { label: 'View Seller Details', icon: '🏬', onClick: () => setDialog({ title: 'Seller Details', rows: sellerRows(selectedOrder) }) },
                  { label: 'Navigate to Seller', icon: '🗺️', onClick: () => openMaps(selectedOrder.sellerAddress) },
                  { label: 'Mark Accepted', icon: '✅', primary: selectedOrder.deliveryStatus === 'Assigned', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Accepted') },
                  { label: 'Mark Picked Up', icon: '📦', primary: selectedOrder.deliveryStatus === 'Accepted', disabled: statusIndex(selectedOrder.deliveryStatus) >= statusIndex('Picked Up') || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Accepted'), onClick: () => updateStatus(selectedOrder, 'Picked Up') },
                ]} />
                <ActionPanel title="Delivery Process" icon="🚚" actions={[
                  { label: 'View Customer Details', icon: '👤', onClick: () => setDialog({ title: 'Customer Details', rows: customerRows(selectedOrder) }) },
                  { label: 'Navigate to Customer', icon: '🗺️', onClick: () => openMaps(selectedOrder.customerAddress) },
                  { label: 'Call Customer', icon: '📞', onClick: () => callNumber(selectedOrder.customerPhone) },
                  { label: 'Advance Status', icon: '➡️', primary: selectedOrder.deliveryStatus !== 'Delivered', disabled: selectedOrder.deliveryStatus === 'Delivered', onClick: () => advanceStatus(selectedOrder) },
                  { label: 'Mark Delivered', icon: '✅', primary: selectedOrder.deliveryStatus === 'Out For Delivery', disabled: selectedOrder.deliveryStatus === 'Delivered' || statusIndex(selectedOrder.deliveryStatus) < statusIndex('Out For Delivery'), onClick: () => updateStatus(selectedOrder, 'Delivered') },
                ]} />
              </section>
            </section>
          ) : <section className="card details"><p>No assigned orders yet.</p></section>}

          <aside className="stack">
            <section className="panel">
              <div className="row"><h2>Return Pickups</h2><span>↩️</span></div>
              <div className="stack" style={{ marginTop: 14 }}>
                {returnPickups.length === 0 ? <p className="muted">No reverse pickups in your queue.</p> : returnPickups.map((ret) => (
                  <div className="note" key={ret.id}>
                    <div className="row"><strong>{ret.id}</strong><span className="status active">{ret.status}</span></div>
                    <p style={{ marginTop: 6 }}>{ret.items[0]?.name}</p>
                    <p className="muted">{ret.customerName} · order {ret.orderId}</p>
                    <p className="muted">Reason: {ret.reason}</p>
                    <div className="action-list" style={{ marginTop: 8 }}>
                      {ret.status === 'Pickup Scheduled' && (
                        <button className="primary" onClick={() => advanceReturn(ret, 'Picked Up')}><span>Mark Picked Up</span> <span>📦</span></button>
                      )}
                      {ret.status === 'Picked Up' && (
                        <button className="primary" onClick={() => advanceReturn(ret, 'Under Inspection')}><span>Delivered to Seller</span> <span>🏬</span></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
        </section>}
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
  return <div className="dialog-backdrop" onClick={close}><section className="dialog" onClick={(event) => event.stopPropagation()}><div className="row"><div><p className="eyebrow">Details</p><h2>{dialog.title}</h2></div><button className="top-button" onClick={close}>✕</button></div><div className="stack" style={{ marginTop: 16 }}>{dialog.rows.map(([label, value]) => <Info key={label} label={label} value={value} />)}</div></section></div>
}

// ── shared helpers for History + Profile ─────────────────────────────
function deliveredTs(order) {
  const hops = (order.statusHistory || []).filter((h) => h.status === 'Delivered')
  return hops.length ? new Date(hops[hops.length - 1].timestamp) : new Date(order.createdAt)
}

function computeStats(orders, id) {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  let delivered = 0, cancelled = 0, month = 0
  for (const o of orders) {
    if (o.deliveryStatus === 'Delivered') { delivered++; if (deliveredTs(o) >= monthStart) month++ }
    else if (o.cancellation?.status === 'Approved') cancelled++
  }
  const attempts = delivered + cancelled
  return { totalDelivered: delivered, totalCancelled: cancelled, thisMonthDeliveries: month, successRate: attempts ? Math.round((delivered / attempts) * 100) : 100 }
}

// ── History tab ──────────────────────────────────────────────────────
function HistoryView({ user }) {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError('')
      try {
        const res = await fetch(`${API_BASE}/orders?history=true&deliveryPartnerId=${encodeURIComponent(user.id)}`)
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load history')
        let rets = []
        try {
          const rres = await fetch(`${API_BASE}/returns`, { headers: authHeaders() })
          const rdata = await rres.json()
          if (rres.ok && rdata.success) {
            rets = (rdata.returns || []).filter((r) => {
              const mine = user.id === 'delivery-demo' ? Boolean(r.pickupPartnerId) : r.pickupPartnerId === user.id
              return mine && ['Picked Up', 'Under Inspection', 'Refund Approved', 'Refunded'].includes(r.status)
            })
          }
        } catch { /* returns are best-effort */ }
        if (!cancelled) { setOrders(data.orders || []); setReturns(rets) }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const rows = useMemo(() => {
    const list = []
    for (const o of orders) {
      const isDelivered = o.deliveryStatus === 'Delivered'
      const isCancelled = o.cancellation?.status === 'Approved' || ['Cancelled', 'Returned'].includes(o.sellerStatus)
      if (isDelivered) {
        list.push({ key: `o-${o.id}`, kind: 'delivered', id: o.id, customer: o.customerName, address: o.customerAddress, amount: o.amount, status: 'Delivered', date: deliveredTs(o) })
      } else if (isCancelled) {
        list.push({ key: `o-${o.id}`, kind: 'cancelled', id: o.id, customer: o.customerName, address: o.customerAddress, amount: o.amount, status: o.sellerStatus === 'Returned' ? 'Returned' : 'Cancelled', date: new Date(o.cancellation?.resolvedAt || o.createdAt) })
      }
    }
    for (const r of returns) {
      const hist = r.statusHistory || []
      list.push({ key: `r-${r.id}`, kind: 'return', id: r.id, customer: r.customerName, address: `Order ${r.orderId}`, amount: r.refund?.amount || 0, status: `Return · ${r.status}`, date: new Date(hist.length ? hist[hist.length - 1].timestamp : r.createdAt) })
    }
    return list.sort((a, b) => b.date - a.date)
  }, [orders, returns])

  const filtered = rows.filter((r) => {
    if (status !== 'all' && r.kind !== status) return false
    if (from && r.date < new Date(from)) return false
    if (to && r.date > new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000)) return false
    if (q) {
      const text = `${r.id} ${r.customer} ${r.address} ${r.status}`.toLowerCase()
      if (!text.includes(q.toLowerCase())) return false
    }
    return true
  })

  return (
    <section className="panel">
      <div className="row"><div><p className="eyebrow">Past & cancelled work</p><h2>Delivery History</h2></div><span>🗂️</span></div>
      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="filters">
        <input placeholder="Search order, customer, address" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All jobs</option>
          <option value="delivered">Completed deliveries</option>
          <option value="cancelled">Cancelled / returned</option>
          <option value="return">Returns handled</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To date" />
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Loading history…</p>
      ) : filtered.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>No matching jobs in your history.</p>
      ) : (
        <table className="htable">
          <thead><tr><th>Reference</th><th>Customer</th><th>Address</th><th>Amount</th><th>Outcome</th><th>Date</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.key}>
                <td><strong>{r.id}</strong></td>
                <td>{r.customer || '—'}</td>
                <td className="muted" style={{ maxWidth: 220 }}>{r.address || '—'}</td>
                <td>{formatMoney(r.amount)}</td>
                <td><span className={`chip ${r.kind}`}>{r.status}</span></td>
                <td className="muted">{formatDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted" style={{ marginTop: 12 }}>{filtered.length} of {rows.length} past jobs</p>
    </section>
  )
}

// ── Profile tab ──────────────────────────────────────────────────────
function fromPartner(p) {
  return { name: p.name || '', phone: p.phone || '', vehicle: p.vehicle || 'Bike', zone: p.zone || '', status: p.status || 'Active' }
}

function ProfileView({ user, onNameChange }) {
  const [partner, setPartner] = useState(null)
  const [stats, setStats] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const canEdit = Boolean(user.token) && user.id !== 'delivery-demo'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/delivery-partners/me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success) {
          if (!cancelled) { setPartner(data.deliveryPartner); setStats(data.stats); setForm(fromPartner(data.deliveryPartner)) }
        } else { throw new Error('no profile') }
      } catch {
        // demo / no token: read-only identity + stats computed from history
        if (!cancelled) {
          const fallback = { id: user.id, name: user.name, email: user.email, phone: '', vehicle: '—', zone: '—', status: 'Active' }
          setPartner(fallback); setForm(fromPartner(fallback))
        }
        try {
          const res = await fetch(`${API_BASE}/orders?history=true&deliveryPartnerId=${encodeURIComponent(user.id)}`)
          const data = await res.json()
          if (res.ok && data.success && !cancelled) setStats(computeStats(data.orders, user.id))
        } catch { /* ignore */ }
      }
      try {
        const res = await fetch(`${API_BASE}/payroll?staffId=me`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success && !cancelled) setPayslips(data.payroll || [])
      } catch { /* payslips are real-partner only */ }
    })()
    return () => { cancelled = true }
  }, [user])

  async function save() {
    setSaving(true); setError(''); setMsg('')
    try {
      const res = await fetch(`${API_BASE}/delivery-partners/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: form.name, phone: form.phone, vehicle: form.vehicle, zone: form.zone, status: form.status }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save profile')
      setPartner(data.deliveryPartner); setStats(data.stats); setEditing(false); setMsg('Profile saved')
      onNameChange?.(data.deliveryPartner.name)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  if (!partner || !form) return <section className="panel"><p className="muted">Loading profile…</p></section>

  const paidEarnings = payslips.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.netPay, 0)
  const latest = payslips[0]
  const tiles = [
    { label: 'Delivered', value: stats?.totalDelivered ?? '—', sub: 'Lifetime', color: '#4f46e5' },
    { label: 'Cancelled', value: stats?.totalCancelled ?? '—', sub: 'Lifetime', color: '#dc2626' },
    { label: 'Success rate', value: stats ? `${stats.successRate}%` : '—', sub: 'Delivered / attempts', color: '#0891b2' },
    { label: 'This month', value: stats?.thisMonthDeliveries ?? '—', sub: 'Deliveries', color: '#1d4ed8' },
    { label: 'Paid earnings', value: canEdit ? formatMoney(paidEarnings) : '—', sub: canEdit ? 'From payslips' : 'Sign in to view', color: '#059669' },
  ]

  return (
    <div className="stack">
      {error && <div className="error">{error}</div>}
      {msg && <div className="status active" style={{ padding: '10px 14px' }}>{msg}</div>}

      {/* Identity card */}
      <section className="card details">
        <div className="row" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="avatar-lg">{partner.avatar ? <img src={partner.avatar} alt="" /> : (partner.name?.[0]?.toUpperCase() || 'D')}</div>
            <div>
              <p className="eyebrow">Delivery partner</p>
              <h2>{partner.name}</h2>
              <p className="muted">{partner.email}</p>
              <span className={`status ${partner.status === 'Active' ? 'active' : ''}`} style={{ marginTop: 8 }}>{partner.status}</span>
            </div>
          </div>
          {canEdit && !editing && <button className="top-button primary" onClick={() => setEditing(true)}>Edit profile</button>}
        </div>

        <div className="form-grid" style={{ marginTop: 20 }}>
          <div className="field"><label>Name</label><input value={form.name} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="field"><label>Phone</label><input value={form.phone} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <div className="field"><label>Vehicle</label>
            <select value={form.vehicle} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value }))}>
              <option>Bike</option><option>Van</option><option>Truck</option><option>Bicycle</option>
            </select>
          </div>
          <div className="field"><label>Zone</label><input value={form.zone} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} /></div>
          <div className="field"><label>Status</label>
            <select value={form.status} disabled={!editing} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option>Active</option><option>On Delivery</option><option>Offline</option>
            </select>
          </div>
        </div>
        {editing && (
          <div className="action-list" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', display: 'grid' }}>
            <button className="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button onClick={() => { setForm(fromPartner(partner)); setEditing(false) }}>Cancel</button>
          </div>
        )}
        {!canEdit && <p className="muted" style={{ marginTop: 14 }}>You're viewing the shared demo console — sign in as a real partner to edit your profile and see payslips.</p>}
      </section>

      {/* Lifetime stat tiles */}
      <div className="tiles">
        {tiles.map((t) => (
          <div className="tile" key={t.label}>
            <span className="eyebrow">{t.label}</span>
            <strong style={{ color: t.color }}>{t.value}</strong>
            <p className="sub">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Payslips */}
      <section className="panel">
        <div className="row"><h2>Payslips</h2><span>💰</span></div>
        {payslips.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>{canEdit ? 'No payslips generated yet. Your admin generates payroll each month.' : 'Sign in as a real partner to view your payslips.'}</p>
        ) : (
          <>
            {latest && (
              <div className="note" style={{ marginTop: 12 }}>
                <div className="row"><strong>Latest · {latest.period}</strong><span className={`status ${latest.status === 'Paid' ? 'done' : 'active'}`}>{latest.status}</span></div>
                <div className="info-grid" style={{ marginTop: 12 }}>
                  <Info label="Base salary" value={formatMoney(latest.baseSalary)} />
                  <Info label="Deliveries" value={String(latest.deliveriesCount)} />
                  <Info label="Incentive" value={formatMoney(latest.incentiveTotal)} />
                  <Info label="Deductions" value={formatMoney(latest.deductions)} />
                  <Info label="Net pay" value={formatMoney(latest.netPay)} />
                  <Info label="Paid on" value={latest.paidAt ? formatDate(latest.paidAt) : 'Pending'} />
                </div>
              </div>
            )}
            <table className="htable">
              <thead><tr><th>Period</th><th>Deliveries</th><th>Net pay</th><th>Status</th></tr></thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.period}</strong></td>
                    <td>{p.deliveriesCount}</td>
                    <td>{formatMoney(p.netPay)}</td>
                    <td><span className={`chip ${p.status === 'Paid' ? 'delivered' : 'return'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
