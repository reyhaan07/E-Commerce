import React, { useState, useEffect, useMemo } from 'react'
import StatCard from '../../components/cards/StatCard'
import { SkeletonCard } from '../../components/Skeleton'
import { FiTrendingUp, FiShoppingCart, FiClock, FiPackage } from 'react-icons/fi'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const statusStyle = {
  Processing: 'badge-info',
  Delivered:  'badge-success',
  Shipped:    'badge-accent',
  Returned:   'badge-danger',
  Cancelled:  'badge-neutral',
  'Ready For Dispatch': 'badge-warning',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 12,
      padding: '10px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12, minWidth: 130,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 600 }}>
            {p.name === 'revenue' ? `₹${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      apiRequest(`/orders?sellerId=${encodeURIComponent(user.id)}`),
      apiRequest('/products?sellerId=me&limit=48'),
    ])
      .then(([o, p]) => { setOrders(o.orders); setProducts(p.products) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const derived = useMemo(() => {
    const active = orders.filter(o => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((sum, o) => sum + o.amount, 0)
    const pending = orders.filter(o => ['Processing', 'Ready For Dispatch'].includes(o.sellerStatus)).length

    // monthly revenue/orders series from real order dates
    const byMonth = {}
    for (const o of active) {
      const d = new Date(o.createdAt)
      const key = d.toLocaleString('en', { month: 'short' })
      byMonth[key] = byMonth[key] || { name: key, revenue: 0, orders: 0, index: d.getMonth() }
      byMonth[key].revenue += o.amount
      byMonth[key].orders += 1
    }
    const series = Object.values(byMonth).sort((a, b) => a.index - b.index)

    // top products by revenue across this seller's order items
    const byProduct = {}
    for (const o of active) {
      for (const item of o.items) {
        byProduct[item.name] = byProduct[item.name] || { name: item.name, sales: 0, revenue: 0 }
        byProduct[item.name].sales += item.qty
        byProduct[item.name].revenue += item.qty * item.price
      }
    }
    const top = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 4)
    const maxRevenue = top[0]?.revenue || 1

    const recent = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    return { revenue, pending, series, top, maxRevenue, recent, activeCount: active.length }
  }, [orders])

  const rating = products.length
    ? (products.filter(p => p.ratingCount > 0).reduce((s, p) => s + p.rating, 0) / Math.max(1, products.filter(p => p.ratingCount > 0).length)).toFixed(1)
    : '—'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Revenue" value={`₹${derived.revenue.toLocaleString('en-IN')}`}
              icon={<span style={{ fontSize: 16 }}>₹</span>} iconBg="rgba(5,150,105,0.1)" iconColor="#059669"
              subtitle={`${derived.activeCount} fulfilled or in-flight orders`} />
            <StatCard title="Total Orders" value={orders.length}
              icon={<FiShoppingCart />} iconBg="rgba(99,102,241,0.1)" iconColor="#6366f1"
              subtitle="All time" />
            <StatCard title="Pending Orders" value={derived.pending}
              icon={<FiClock />} iconBg="rgba(217,119,6,0.1)" iconColor="#d97706"
              subtitle="Need dispatch action" />
            <StatCard title="Catalog" value={products.length}
              icon={<FiPackage />} iconBg="rgba(14,165,233,0.1)" iconColor="#0ea5e9"
              subtitle={`Avg rating ${rating}★`} />
          </>
        )}
      </div>

      {/* Chart + recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass p-5 xl:col-span-2" style={{ borderRadius: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Revenue Overview</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly performance from your orders</p>
            </div>
            <FiTrendingUp style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={derived.series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Orders</h3>
          <div className="space-y-3">
            {derived.recent.map(o => (
              <div key={o.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold truncate" style={{ color: 'var(--accent)' }}>{o.id}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{o.customerName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">₹{o.amount}</p>
                  <span className={`badge ${statusStyle[o.sellerStatus] || 'badge-neutral'}`} style={{ fontSize: 10 }}>{o.sellerStatus}</span>
                </div>
              </div>
            ))}
            {!loading && derived.recent.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No orders yet.</p>}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="glass p-5" style={{ borderRadius: 20 }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Selling Products</h3>
        <div className="space-y-3">
          {derived.top.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="w-5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
              <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.sales} sold</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>₹{p.revenue.toLocaleString('en-IN')}</span>
              <div className="w-40 progress-bar hidden sm:block">
                <div className="progress-fill" style={{ width: `${Math.round((p.revenue / derived.maxRevenue) * 100)}%`, background: '#6366f1' }} />
              </div>
            </div>
          ))}
          {!loading && derived.top.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sales yet.</p>}
        </div>
      </div>
    </div>
  )
}
