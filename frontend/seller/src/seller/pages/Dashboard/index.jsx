import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/cards/StatCard'
import { SkeletonCard } from '../../components/Skeleton'
import {
  FiShoppingCart, FiClock, FiPackage, FiPlus, FiLayers, FiShoppingBag,
  FiBarChart2, FiSettings, FiExternalLink, FiStar, FiDownload, FiArrowRight,
} from 'react-icons/fi'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

const STOREFRONT_URL = 'http://localhost:5175'

const statusStyle = {
  Processing: 'badge-info',
  Delivered:  'badge-success',
  Shipped:    'badge-accent',
  Returned:   'badge-danger',
  Cancelled:  'badge-neutral',
  'Ready For Dispatch': 'badge-warning',
}

function pctDelta(series, key) {
  if (series.length < 2) return null
  const last = series[series.length - 1][key]
  const prev = series[series.length - 2][key]
  if (!prev) return null
  const pct = ((last - prev) / prev) * 100
  return { delta: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, type: pct >= 0 ? 'up' : 'down' }
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-bd)', borderRadius: 12,
      padding: '10px 14px', boxShadow: 'var(--shadow-lg)', fontSize: 12, minWidth: 130,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 700 }}>
            {p.name === 'revenue' ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function initials(s) { return (s?.trim()?.[0] || '?').toUpperCase() }

export default function Dashboard() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
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

  const productByName = useMemo(() => {
    const map = {}
    for (const p of products) map[p.name] = p
    return map
  }, [products])

  const derived = useMemo(() => {
    const active = orders.filter(o => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((sum, o) => sum + o.amount, 0)
    const pending = orders.filter(o => ['Processing', 'Ready For Dispatch'].includes(o.sellerStatus)).length

    const byMonth = {}
    for (const o of active) {
      const d = new Date(o.createdAt)
      const key = d.toLocaleString('en', { month: 'short' })
      byMonth[key] = byMonth[key] || { name: key, revenue: 0, orders: 0, index: d.getMonth() }
      byMonth[key].revenue += o.amount
      byMonth[key].orders += 1
    }
    const series = Object.values(byMonth).sort((a, b) => a.index - b.index)

    const byProduct = {}
    for (const o of active) {
      for (const item of o.items) {
        byProduct[item.name] = byProduct[item.name] || { name: item.name, sales: 0, revenue: 0 }
        byProduct[item.name].sales += item.qty
        byProduct[item.name].revenue += item.qty * item.price
      }
    }
    const top = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    const maxRevenue = top[0]?.revenue || 1

    const recent = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)

    return {
      revenue, pending, series, top, maxRevenue, recent, activeCount: active.length,
      revenueSpark: series.map(s => s.revenue),
      ordersSpark: series.map(s => s.orders),
      revenueDelta: pctDelta(series, 'revenue'),
      ordersDelta: pctDelta(series, 'orders'),
    }
  }, [orders])

  const ratedProducts = products.filter(p => p.ratingCount > 0)
  const rating = ratedProducts.length
    ? (ratedProducts.reduce((s, p) => s + p.rating, 0) / ratedProducts.length).toFixed(1)
    : '—'

  const chart = isDark
    ? { grid: 'rgba(255,255,255,0.06)', axis: '#64748b', stroke: '#818cf8', fillTop: 'rgba(129,140,248,0.35)', fillBot: 'rgba(129,140,248,0)' }
    : { grid: '#eef2f7', axis: '#94a3b8', stroke: '#6366f1', fillTop: 'rgba(99,102,241,0.26)', fillBot: 'rgba(99,102,241,0)' }

  function exportCsv() {
    const rows = [['Order ID', 'Customer', 'Status', 'Amount', 'Date']]
    for (const o of orders) {
      rows.push([o.id, o.customerName, o.sellerStatus, o.amount, new Date(o.createdAt).toLocaleDateString('en-IN')])
    }
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'shopsphere-orders.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const actions = [
    { icon: FiPlus,         label: 'Add Product',      desc: 'List a new item',    onClick: () => navigate('/seller/products') },
    { icon: FiLayers,       label: 'Manage Inventory', desc: 'Stock & restock',    onClick: () => navigate('/seller/inventory') },
    { icon: FiShoppingBag,  label: 'View Orders',      desc: 'Fulfil & track',     onClick: () => navigate('/seller/orders') },
    { icon: FiBarChart2,    label: 'Analytics',        desc: 'Sales insights',     onClick: () => navigate('/seller/dashboard') },
    { icon: FiSettings,     label: 'Store Settings',   desc: 'Preferences',        onClick: () => navigate('/seller/settings') },
    { icon: FiExternalLink, label: 'View Storefront',  desc: 'See your shop live',  onClick: () => window.open(STOREFRONT_URL, '_blank') },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header !mb-2">
        <div>
          <h2 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Seller'} 👋</h2>
          <p className="page-subtitle">Here's how your store is performing.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip" style={{ cursor: 'default' }}>Last 6 months</span>
          <button className="btn-ghost h-10" onClick={exportCsv}><FiDownload size={15} /> Export</button>
          <button className="btn-primary h-10" onClick={() => navigate('/seller/products')}><FiPlus size={16} /> Add product</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Revenue" value={`₹${derived.revenue.toLocaleString('en-IN')}`}
              icon={<span style={{ fontSize: 18, fontWeight: 700 }}>₹</span>} iconBg="var(--success-soft)" iconColor="var(--success)"
              accent="#10b981" spark={derived.revenueSpark}
              delta={derived.revenueDelta?.delta} deltaType={derived.revenueDelta?.type}
              subtitle={`${derived.activeCount} fulfilled or in-flight`} />
            <StatCard title="Total Orders" value={orders.length.toLocaleString()}
              icon={<FiShoppingCart />} iconBg="var(--accent-soft)" iconColor="var(--accent)"
              accent="#6366f1" spark={derived.ordersSpark}
              delta={derived.ordersDelta?.delta} deltaType={derived.ordersDelta?.type}
              subtitle="All time" />
            <StatCard title="Pending Orders" value={derived.pending}
              icon={<FiClock />} iconBg="var(--warning-soft)" iconColor="var(--warning)"
              subtitle="Need dispatch action" />
            <StatCard title="Catalog" value={products.length}
              icon={<FiPackage />} iconBg="var(--info-soft)" iconColor="var(--info)"
              subtitle={`Avg rating ${rating}★`} />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((a, i) => (
          <button key={a.label} onClick={a.onClick}
            className="surface hover-lift p-4 flex flex-col items-start gap-2.5 text-left animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <a.icon size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Chart + recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title">Revenue Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly performance from your orders</p>
            </div>
            {derived.revenueDelta && (
              <span className={`badge ${derived.revenueDelta.type === 'up' ? 'badge-success' : 'badge-danger'}`}>
                {derived.revenueDelta.delta} vs last month
              </span>
            )}
          </div>
          <div style={{ width: '100%', height: 268 }}>
            <ResponsiveContainer>
              <AreaChart data={derived.series} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.fillTop} />
                    <stop offset="100%" stopColor={chart.fillBot} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: chart.axis }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: chart.axis }} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.stroke, strokeOpacity: 0.25 }} />
                <Area type="monotone" dataKey="revenue" stroke={chart.stroke} strokeWidth={2.5} fill="url(#rev)" dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Orders</h3>
            <button className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}
              onClick={() => navigate('/seller/orders')}>View all <FiArrowRight size={12} /></button>
          </div>
          <div className="space-y-1">
            {derived.recent.map(o => (
              <button key={o.id} onClick={() => navigate('/seller/orders')}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left hover:bg-[var(--accent-soft)]">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-soft)' }}>
                  {initials(o.customerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{o.customerName}</p>
                  <p className="font-mono text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{o.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tnum" style={{ color: 'var(--text-primary)' }}>₹{o.amount.toLocaleString('en-IN')}</p>
                  <span className={`badge ${statusStyle[o.sellerStatus] || 'badge-neutral'}`} style={{ fontSize: 9 }}>{o.sellerStatus}</span>
                </div>
              </button>
            ))}
            {!loading && derived.recent.length === 0 && (
              <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Top Selling Products</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ranked by revenue across your orders</p>
          </div>
          <button className="btn-ghost h-9" onClick={() => navigate('/seller/products')}>All products</button>
        </div>
        <div className="space-y-1.5">
          {derived.top.map((p, i) => {
            const prod = productByName[p.name]
            const img = prod?.image || prod?.images?.[0]
            const pct = Math.round((p.revenue / derived.maxRevenue) * 100)
            return (
              <div key={p.name} className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-[var(--accent-soft)]">
                <span className="w-5 text-sm font-bold text-center shrink-0" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-soft)' }}>
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{initials(p.name)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sales} sold</span>
                    {prod?.ratingCount > 0 && (
                      <span className="text-[11px] inline-flex items-center gap-0.5" style={{ color: 'var(--warning)' }}>
                        <FiStar size={10} fill="currentColor" /> {prod.rating?.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:block w-32 shrink-0">
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                </div>
                <span className="text-sm font-bold tnum shrink-0 w-24 text-right" style={{ color: 'var(--text-primary)' }}>
                  ₹{p.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            )
          })}
          {!loading && derived.top.length === 0 && (
            <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>No sales yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
