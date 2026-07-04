import React, { useState, useEffect } from 'react'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import EmptyState from '../../components/EmptyState'
import { FiLayers, FiAlertTriangle, FiRefreshCw, FiSearch } from 'react-icons/fi'
import StatCard from '../../components/cards/StatCard'

const inventoryData = [
  { name: 'Wireless Headphones Pro', sku: 'SKU-1001', category: 'Electronics', qty: 14,  threshold: 10, status: 'healthy'  },
  { name: 'Smart Watch Series X',    sku: 'SKU-1002', category: 'Electronics', qty: 3,   threshold: 5,  status: 'low'      },
  { name: 'Linen Casual Shirt',      sku: 'SKU-1003', category: 'Clothing',    qty: 0,   threshold: 5,  status: 'out'      },
  { name: 'Bamboo Desk Organizer',   sku: 'SKU-1004', category: 'Home',        qty: 22,  threshold: 8,  status: 'healthy'  },
  { name: 'Running Shoes Ultra',     sku: 'SKU-1005', category: 'Sports',      qty: 7,   threshold: 10, status: 'low'      },
  { name: 'Skincare Glow Kit',       sku: 'SKU-1006', category: 'Beauty',      qty: 0,   threshold: 5,  status: 'out'      },
  { name: 'Noise-Cancel Earbuds',    sku: 'SKU-1007', category: 'Electronics', qty: 5,   threshold: 5,  status: 'low'      },
  { name: 'Yoga Mat Premium',        sku: 'SKU-1008', category: 'Sports',      qty: 18,  threshold: 8,  status: 'healthy'  },
  { name: 'Coffee Grinder Pro',      sku: 'SKU-1009', category: 'Home',        qty: 9,   threshold: 8,  status: 'healthy'  },
  { name: 'Face Serum Vitamin C',    sku: 'SKU-1010', category: 'Beauty',      qty: 4,   threshold: 5,  status: 'low'      },
]

const statusLabel = { healthy: 'In Stock', low: 'Low Stock', out: 'Out of Stock' }
const statusClass = { healthy: 'badge-success', low: 'badge-warning', out: 'badge-danger' }

export default function Inventory() {
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t) }, [])

  const totalStock = inventoryData.reduce((a, b) => a + b.qty, 0)
  const lowStock   = inventoryData.filter(i => i.status === 'low').length
  const outStock   = inventoryData.filter(i => i.status === 'out').length

  const filtered = inventoryData.filter(i => {
    const matchQ = i.name.toLowerCase().includes(query.toLowerCase()) || i.sku.toLowerCase().includes(query.toLowerCase())
    const matchF = filter === 'all' || i.status === filter
    return matchQ && matchF
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle">Track and manage stock levels</p>
        </div>
        <button className="btn-primary"><FiRefreshCw size={14} /> Sync Stock</button>
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
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Threshold</th><th>Status</th><th>Stock Level</th></tr></thead>
            <tbody>
              {filtered.map((item, i) => {
                const pct = item.threshold > 0 ? Math.min(100, Math.round((item.qty / (item.threshold * 3)) * 100)) : 0
                return (
                  <tr key={i}>
                    <td className="font-medium max-w-[180px] truncate">{item.name}</td>
                    <td><code className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#f1f5f9', color: 'var(--text-soft)' }}>{item.sku}</code></td>
                    <td>{item.category}</td>
                    <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.qty}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.threshold}</td>
                    <td><span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></td>
                    <td style={{ minWidth: 120 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-bar">
                          <div className="progress-fill" style={{
                            width: `${pct}%`,
                            background: item.status === 'out' ? '#e11d48' : item.status === 'low' ? '#d97706' : '#059669'
                          }} />
                        </div>
                        <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
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
