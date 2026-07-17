import React, { useState, useEffect } from 'react'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import { FiLayers, FiAlertTriangle, FiSearch, FiCheck } from 'react-icons/fi'
import StatCard from '../../components/cards/StatCard'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const LOW_THRESHOLD = 5

const statusOf = (stock) => (stock === 0 ? 'out' : stock <= LOW_THRESHOLD ? 'low' : 'healthy')
const statusLabel = { healthy: 'In Stock', low: 'Low Stock', out: 'Out of Stock' }
const statusClass = { healthy: 'badge-success', low: 'badge-warning', out: 'badge-danger' }

export default function Inventory() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [filter,  setFilter]  = useState('all')
  const [drafts, setDrafts] = useState({}) // productId -> stock being typed
  const [savingId, setSavingId] = useState(null)
  const [feedback, setFeedback] = useState('')

  function refresh() {
    if (!user) return
    apiRequest('/products?sellerId=me&limit=48')
      .then((d) => setItems(d.products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveStock(product) {
    const value = Number(drafts[product.id])
    if (!Number.isFinite(value) || value < 0) return
    setSavingId(product.id)
    try {
      await apiRequest(`/products/${product.id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock: value }) })
      setFeedback(`${product.name} stock updated to ${value}`)
      setDrafts((d) => ({ ...d, [product.id]: undefined }))
      refresh()
    } catch (err) {
      setFeedback(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const totalStock = items.reduce((a, b) => a + b.stock, 0)
  const lowStock   = items.filter(i => statusOf(i.stock) === 'low').length
  const outStock   = items.filter(i => statusOf(i.stock) === 'out').length

  const filtered = items.filter(i => {
    const matchQ = i.name.toLowerCase().includes(query.toLowerCase()) || (i.sku || '').toLowerCase().includes(query.toLowerCase())
    const matchF = filter === 'all' || statusOf(i.stock) === filter
    return matchQ && matchF
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle">Stock levels for your {items.length} products</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Stock Units" value={totalStock.toLocaleString()}
              icon={<FiLayers />} iconBg="rgba(99,102,241,0.1)" subtitle="Across all products" />
            <StatCard title="Low Stock Items" value={lowStock}
              icon={<FiAlertTriangle />} iconBg="rgba(217,119,6,0.1)"
              subtitle="Needs restocking" delta={`${lowStock} items`} deltaType="down" />
            <StatCard title="Out of Stock" value={outStock}
              icon={<FiAlertTriangle />} iconBg="rgba(225,29,72,0.1)"
              subtitle="Urgent attention" delta={`${outStock} items`} deltaType="down" />
          </>
        )}
      </div>

      {feedback && <div className="glass p-3 text-sm font-medium" style={{ borderRadius: 12 }}>{feedback}</div>}

      {/* Filter tabs + search */}
      <div className="glass p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ borderRadius: 16 }}>
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by name or SKU…" className="input pl-9 h-9 text-sm"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid var(--border)' }}>
          {['all','healthy','low','out'].map(f => (
            <button key={f}
              className="px-3 h-7 rounded-lg text-xs font-medium transition-all duration-200 capitalize"
              style={{
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
                fontWeight: filter === f ? 600 : 500,
              }}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} /> : filtered.length === 0 ? (
        <EmptyState
          icon={<FiLayers />}
          title="No items match your filter"
          description="Try changing the status filter or searching by a different keyword."
          action={<button className="btn-ghost" onClick={() => { setQuery(''); setFilter('all') }}>Reset Filters</button>}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Placement</th><th>Qty</th><th>Status</th><th>Update Stock</th></tr></thead>
            <tbody>
              {filtered.map((item) => {
                const status = statusOf(item.stock)
                const draft = drafts[item.id]
                return (
                  <tr key={item.id}>
                    <td className="font-medium max-w-[200px] truncate">{item.name}</td>
                    <td><code className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#f1f5f9', color: 'var(--text-soft)' }}>{item.sku}</code></td>
                    <td className="text-xs">{item.category}{item.productType ? ` → ${item.productType}` : ''}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.stock}</td>
                    <td><span className={`badge ${statusClass[status]}`}>{statusLabel[status]}</span></td>
                    <td style={{ minWidth: 150 }}>
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="0" className="input h-8 text-xs" style={{ width: 72 }}
                          value={draft !== undefined ? draft : item.stock}
                          onChange={e => setDrafts(d => ({ ...d, [item.id]: e.target.value }))} />
                        <button className="btn-icon" title="Save" style={{ width: 28, height: 28 }}
                          disabled={savingId === item.id || draft === undefined || Number(draft) === item.stock}
                          onClick={() => saveStock(item)}>
                          <FiCheck size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
