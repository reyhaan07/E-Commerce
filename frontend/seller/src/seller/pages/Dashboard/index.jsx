import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/cards/StatCard'
import SectionCard from '../../components/ui/SectionCard'
import QuickActionCard from '../../components/ui/QuickActionCard'
import StatusBadge from '../../components/StatusBadge'
import { SkeletonCard } from '../../components/Skeleton'
import {
  FiShoppingCart, FiClock, FiPackage, FiPlus, FiLayers, FiShoppingBag,
  FiBarChart2, FiStar, FiDownload, FiArrowRight, FiTrendingUp, FiTruck,
  FiDollarSign, FiCheckCircle, FiSettings,
} from 'react-icons/fi'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { STOREFRONT_URL } from '../../config/appNav'

function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
function initials(s) { return (s?.trim()?.[0] || '?').toUpperCase() }

function pctDelta(series, key) {
  if (series.length < 2) return null
  const last = series[series.length - 1][key]
  const prev = series[series.length - 2][key]
  if (!prev) return null
  const pct = ((last - prev) / prev) * 100
  return { delta: `${Math.abs(pct).toFixed(1)}%`, type: pct >= 0 ? 'up' : 'down' }
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-bd)', borderRadius: 10, padding: '9px 12px', boxShadow: 'var(--shadow-lg)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 700 }}>{p.name === 'revenue' ? inr(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

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

  const d = useMemo(() => {
    const active = orders.filter(o => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((s, o) => s + o.amount, 0)
    const pending = orders.filter(o => ['Processing', 'Ready For Dispatch'].includes(o.sellerStatus)).length
    const readyForDispatch = orders.filter(o => o.sellerStatus === 'Ready For Dispatch').length
    const delivered = orders.filter(o => o.sellerStatus === 'Delivered').length

    const byMonth = {}
    for (const o of active) {
      const dt = new Date(o.createdAt)
      const key = dt.toLocaleString('en', { month: 'short' })
      byMonth[key] = byMonth[key] || { name: key, revenue: 0, orders: 0, index: dt.getFullYear() * 12 + dt.getMonth() }
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
    const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    const avgOrder = active.length ? Math.round(revenue / active.length) : 0

    return {
      revenue, pending, readyForDispatch, delivered, series, top, recent, avgOrder,
      revenueSpark: series.map(s => s.revenue),
      ordersSpark: series.map(s => s.orders),
      revenueDelta: pctDelta(series, 'revenue'),
      ordersDelta: pctDelta(series, 'orders'),
      maxRevenue: top[0]?.revenue || 1,
    }
  }, [orders])

  const rated = products.filter(p => p.ratingCount > 0)
  const rating = rated.length ? (rated.reduce((s, p) => s + p.rating, 0) / rated.length) : 0
  const liveProducts = products.filter(p => p.approvalStatus === 'Approved').length

  const chart = isDark
    ? { stroke: '#818cf8', fillTop: 'rgba(129,140,248,0.30)', fillBot: 'rgba(129,140,248,0)' }
    : { stroke: '#6366f1', fillTop: 'rgba(99,102,241,0.22)', fillBot: 'rgba(99,102,241,0)' }

  function exportCsv() {
    const rows = [['Order ID', 'Customer', 'Status', 'Amount', 'Date']]
    for (const o of orders) rows.push([o.id, o.customerName, o.sellerStatus, o.amount, new Date(o.createdAt).toLocaleDateString('en-IN')])
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'shopsphere-orders.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const quickActions = [
    { icon: FiPlus,         label: 'Add Product',      onClick: () => navigate('/seller/products?new=1'), active: true },
    { icon: FiLayers,       label: 'Manage Inventory', onClick: () => navigate('/seller/inventory') },
    { icon: FiShoppingBag,  label: 'View Orders',      onClick: () => navigate('/seller/orders') },
    { icon: FiBarChart2,    label: 'Analytics',        onClick: () => navigate('/seller/analytics') },
    { icon: FiSettings,     label: 'Store Settings',   onClick: () => navigate('/seller/settings') },
    { icon: FiShoppingCart, label: 'View Storefront',  onClick: () => window.open(STOREFRONT_URL, '_blank') },
  ]

  const miniMetrics = [
    { icon: FiDollarSign, tint: ['var(--success-soft)', 'var(--success)'], value: inr(d.avgOrder), label: 'Avg Order Value', sub: `${d.delivered} fulfilled` },
    { icon: FiCheckCircle, tint: ['var(--accent-soft)', 'var(--accent)'], value: d.delivered, label: 'Delivered Orders', sub: 'All time' },
    { icon: FiTruck, tint: ['var(--warning-soft)', 'var(--warning)'], value: d.readyForDispatch, label: 'Pending Dispatch', sub: 'Awaiting pickup' },
    { icon: FiPackage, tint: ['var(--info-soft)', 'var(--info)'], value: liveProducts, label: 'Live Products', sub: `${products.length} total` },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome header */}
      <div className="page-header !mb-1">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0] || 'Seller'} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={exportCsv}><FiDownload size={15} /> Export</button>
          <button className="btn-primary" onClick={() => navigate('/seller/products?new=1')}><FiPlus size={16} /> Add Product</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 stagger">
        {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard title="Total Revenue" value={inr(d.revenue)} icon={<FiDollarSign size={18} />} tint="green"
              spark={d.revenueSpark} delta={d.revenueDelta?.delta} deltaType={d.revenueDelta?.type} deltaLabel="vs last month" />
            <StatCard title="Total Orders" value={orders.length.toLocaleString()} icon={<FiShoppingCart size={18} />} tint="indigo"
              spark={d.ordersSpark} delta={d.ordersDelta?.delta} deltaType={d.ordersDelta?.type} deltaLabel="vs last month" />
            <StatCard title="Pending Orders" value={d.pending} icon={<FiClock size={18} />} tint="orange" subtitle="Need dispatch action" />
            <StatCard title="Total Products" value={products.length} icon={<FiPackage size={18} />} tint="blue" subtitle={`${liveProducts} live products`} />
            <StatCard title="Average Rating" value={rating ? rating.toFixed(1) : '—'} icon={<FiStar size={18} />} tint="amber"
              footer={
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <FiStar key={n} size={13} fill={n <= Math.round(rating) ? 'var(--amber)' : 'none'} style={{ color: 'var(--amber)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rated.length} rated</span>
                </div>
              } />
          </>
        )}
      </div>

      {/* Quick actions */}
      <SectionCard title="Quick Actions" bodyClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickActions.map(a => <QuickActionCard key={a.label} {...a} />)}
      </SectionCard>

      {/* Revenue + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard className="xl:col-span-2" title="Revenue Overview" description="Monthly performance from your orders"
          action={d.revenueDelta && (
            <span className={`badge ${d.revenueDelta.type === 'up' ? 'badge-success' : 'badge-danger'}`}>
              {d.revenueDelta.type === 'up' ? '▲' : '▼'} {d.revenueDelta.delta} vs last month
            </span>
          )}>
          <div style={{ width: '100%', height: 280 }}>
            {d.series.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={d.series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chart.fillTop} />
                      <stop offset="100%" stopColor={chart.fillBot} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} width={48}
                    tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: chart.stroke, strokeOpacity: 0.2 }} />
                  <Area type="monotone" dataKey="revenue" stroke={chart.stroke} strokeWidth={2.5} fill="url(#rev)" dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyMini text={loading ? 'Loading…' : 'No revenue data yet.'} />}
          </div>
        </SectionCard>

        <SectionCard title="Recent Orders"
          action={<button className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }} onClick={() => navigate('/seller/orders')}>View all <FiArrowRight size={12} /></button>}
          bodyClassName="space-y-1">
          {d.recent.map(o => (
            <button key={o.id} onClick={() => navigate('/seller/orders')}
              className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left hover:bg-[var(--surface-2)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>{initials(o.customerName)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{o.customerName}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{o.id}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold tnum" style={{ color: 'var(--text-primary)' }}>{inr(o.amount)}</p>
                <StatusBadge status={o.sellerStatus} className="mt-0.5" />
              </div>
            </button>
          ))}
          {!loading && d.recent.length === 0 && <EmptyMini text="No orders yet." />}
        </SectionCard>
      </div>

      {/* Top products + mini metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard className="xl:col-span-2" title="Top Selling Products" description="Ranked by revenue across your orders"
          action={<button className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }} onClick={() => navigate('/seller/products')}>View all <FiArrowRight size={12} /></button>}
          bodyClassName="space-y-1">
          {d.top.map((p, i) => {
            const prod = productByName[p.name]
            const img = prod?.image || prod?.images?.[0]
            const pct = Math.round((p.revenue / d.maxRevenue) * 100)
            return (
              <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-[var(--surface-2)]">
                <span className="w-5 text-sm font-bold text-center shrink-0" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-3)', color: 'var(--text-soft)' }}>
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{initials(p.name)}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sales} sold</span>
                </div>
                <div className="hidden sm:block w-28 shrink-0"><div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div></div>
                <span className="text-[13px] font-bold tnum shrink-0 w-20 text-right" style={{ color: 'var(--text-primary)' }}>{inr(p.revenue)}</span>
              </div>
            )
          })}
          {!loading && d.top.length === 0 && <EmptyMini text="No sales yet." />}
        </SectionCard>

        {/* Store health strip */}
        <div className="grid grid-cols-2 gap-4 content-start">
          {miniMetrics.map(m => (
            <div key={m.label} className="card p-4">
              <div className="soft-icon mb-2.5" style={{ background: m.tint[0], color: m.tint[1] }}><m.icon size={17} /></div>
              <div className="text-lg font-bold tnum" style={{ color: 'var(--text-primary)' }}>{m.value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-soft)' }}>{m.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyMini({ text }) {
  return <div className="flex items-center justify-center h-full py-8 text-sm" style={{ color: 'var(--text-muted)' }}>{text}</div>
}
