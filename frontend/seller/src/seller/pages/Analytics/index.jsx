import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import StatCard from '../../components/cards/StatCard'
import { SkeletonCard } from '../../components/Skeleton'
import { FiDollarSign, FiShoppingCart, FiTrendingUp, FiBox } from 'react-icons/fi'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
const PERIODS = [{ k: 3, label: 'Last 3 months' }, { k: 6, label: 'Last 6 months' }, { k: 12, label: 'Last 12 months' }]
const CAT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#0ea5e9', '#a855f7', '#ef4444', '#14b8a6']

function ChartTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-bd)', borderRadius: 10, padding: '9px 12px', boxShadow: 'var(--shadow-lg)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ color: p.color || p.fill, fontWeight: 700 }}>{money ? inr(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(6)

  useEffect(() => {
    if (!user) return
    Promise.all([
      apiRequest(`/orders?sellerId=${encodeURIComponent(user.id)}`),
      apiRequest('/products?sellerId=me&limit=48'),
    ]).then(([o, p]) => { setOrders(o.orders); setProducts(p.products) }).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const catByName = useMemo(() => {
    const m = {}
    for (const p of products) m[p.name] = p.category
    return m
  }, [products])

  const d = useMemo(() => {
    const active = orders.filter(o => !['Cancelled', 'Returned'].includes(o.sellerStatus))
    const revenue = active.reduce((s, o) => s + o.amount, 0)
    let units = 0
    const byMonth = {}
    const byCat = {}
    for (const o of active) {
      const dt = new Date(o.createdAt)
      const key = dt.toLocaleString('en', { month: 'short', year: '2-digit' })
      byMonth[key] = byMonth[key] || { name: key, revenue: 0, orders: 0, index: dt.getFullYear() * 12 + dt.getMonth() }
      byMonth[key].revenue += o.amount
      byMonth[key].orders += 1
      for (const it of o.items) {
        units += it.qty
        const cat = catByName[it.name] || 'Other'
        byCat[cat] = (byCat[cat] || 0) + it.qty * it.price
      }
    }
    const series = Object.values(byMonth).sort((a, b) => a.index - b.index).slice(-period)
    const cats = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7)
    const byProduct = {}
    for (const o of active) for (const it of o.items) {
      byProduct[it.name] = byProduct[it.name] || { name: it.name, sales: 0, revenue: 0 }
      byProduct[it.name].sales += it.qty; byProduct[it.name].revenue += it.qty * it.price
    }
    const top = Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 6)
    return { revenue, orderCount: active.length, units, avg: active.length ? Math.round(revenue / active.length) : 0, series, cats, top, maxCat: cats[0]?.value || 1 }
  }, [orders, catByName, period])

  const chart = isDark
    ? { stroke: '#818cf8', fillTop: 'rgba(129,140,248,0.30)', fillBot: 'rgba(129,140,248,0)', bar: '#818cf8' }
    : { stroke: '#6366f1', fillTop: 'rgba(99,102,241,0.22)', fillBot: 'rgba(99,102,241,0)', bar: '#6366f1' }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Sales insights and performance across your store."
        actions={
          <select className="input h-10 w-44" value={period} onChange={e => setPeriod(Number(e.target.value))}>
            {PERIODS.map(p => <option key={p.k} value={p.k}>{p.label}</option>)}
          </select>
        } />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : (
          <>
            <StatCard title="Total Revenue" value={inr(d.revenue)} icon={<FiDollarSign size={18} />} tint="green" spark={d.series.map(s => s.revenue)} />
            <StatCard title="Orders" value={d.orderCount} icon={<FiShoppingCart size={18} />} tint="indigo" spark={d.series.map(s => s.orders)} />
            <StatCard title="Units Sold" value={d.units} icon={<FiBox size={18} />} tint="blue" subtitle="Across all orders" />
            <StatCard title="Avg Order Value" value={inr(d.avg)} icon={<FiTrendingUp size={18} />} tint="amber" subtitle="Per fulfilled order" />
          </>
        )}
      </div>

      {/* Revenue + Orders charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="Revenue Trend" description="Revenue per month">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={d.series} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                <defs><linearGradient id="arev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chart.fillTop} /><stop offset="100%" stopColor={chart.fillBot} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} width={48} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`} />
                <Tooltip content={<ChartTooltip money />} cursor={{ stroke: chart.stroke, strokeOpacity: 0.2 }} />
                <Area type="monotone" dataKey="revenue" stroke={chart.stroke} strokeWidth={2.5} fill="url(#arev)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Orders Trend" description="Orders per month">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={d.series} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="orders" fill={chart.bar} radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Category breakdown + top products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="Sales by Category" description="Revenue share across categories">
          {d.cats.length === 0 ? <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No sales yet.</p> : (
            <div className="space-y-3">
              {d.cats.map((c, i) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text-soft)' }}>{c.name}</span>
                    <span className="text-[13px] font-semibold tnum" style={{ color: 'var(--text-primary)' }}>{inr(c.value)}</span>
                  </div>
                  <div className="progress-bar"><div className="h-full rounded-full" style={{ width: `${Math.round((c.value / d.maxCat) * 100)}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} /></div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Top Products" description="Best performers by revenue" bodyClassName="space-y-1">
          {d.top.length === 0 ? <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>No sales yet.</p> : d.top.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
              <span className="w-5 text-sm font-bold text-center shrink-0" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sales} sold</p>
              </div>
              <span className="text-[13px] font-bold tnum" style={{ color: 'var(--text-primary)' }}>{inr(p.revenue)}</span>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  )
}
