import React, { useState, useEffect } from 'react'
import StatCard from '../../components/cards/StatCard'
import { SkeletonCard } from '../../components/Skeleton'
import {
  FiTrendingUp, FiShoppingCart, FiClock,
  FiArrowRight, FiPackage, FiRefreshCw
} from 'react-icons/fi'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const chartData = months.map((name, i) => ({
  name,
  revenue: Math.floor(8000 + Math.sin(i * 0.5) * 5000 + Math.random() * 4000),
  orders:  Math.floor(80  + Math.sin(i * 0.4) * 40  + Math.random() * 30),
}))

const recentOrders = [
  { id: '#ORD-1041', customer: 'Priya Sharma',  amount: '₹340', status: 'Processing', time: '2m ago' },
  { id: '#ORD-1040', customer: 'Arjun Mehta',   amount: '₹120', status: 'Delivered',  time: '18m ago' },
  { id: '#ORD-1039', customer: 'Meera Nair',    amount: '₹890', status: 'Shipped',    time: '1h ago' },
  { id: '#ORD-1038', customer: 'Rohan Gupta',   amount: '₹55',  status: 'Returned',   time: '3h ago' },
  { id: '#ORD-1037', customer: 'Sana Kapoor',   amount: '₹210', status: 'Delivered',  time: '5h ago' },
]

const topProducts = [
  { name: 'Wireless Headphones', sales: 284, revenue: '₹14,200', pct: 82 },
  { name: 'Smart Watch Pro',     sales: 196, revenue: '₹9,800',  pct: 65 },
  { name: 'Laptop Stand Deluxe', sales: 143, revenue: '₹5,720',  pct: 48 },
  { name: 'USB-C Hub 7-Port',    sales: 98,  revenue: '₹2,940',  pct: 32 },
]

const statusStyle = {
  Processing: 'badge-info',
  Delivered:  'badge-success',
  Shipped:    'badge-accent',
  Returned:   'badge-danger',
  Pending:    'badge-warning',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 12,
      minWidth: 130,
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

const stats = [
  {
    title: 'Total Revenue', value: '₹1,24,560', delta: '+12.4% vs last month',
    deltaType: 'up', icon: <span style={{ fontSize: 16 }}>₹</span>,
    iconBg: 'rgba(5,150,105,0.1)', iconColor: '#059669',
    subtitle: 'All time earnings'
  },
  {
    title: 'Monthly Revenue', value: '₹12,340', delta: '+8.1% vs last month',
    deltaType: 'up', icon: <FiTrendingUp />,
    iconBg: 'rgba(99,102,241,0.1)', iconColor: '#6366f1',
    subtitle: 'June 2026'
  },
  {
    title: 'Total Orders', value: '1,240', delta: '+5.3% vs last month',
    deltaType: 'up', icon: <FiShoppingCart />,
    iconBg: 'rgba(8,145,178,0.1)', iconColor: '#0891b2',
    subtitle: 'All time orders'
  },
  {
    title: 'Pending Orders', value: '32', delta: '-2 since yesterday',
    deltaType: 'down', icon: <FiClock />,
    iconBg: 'rgba(217,119,6,0.1)', iconColor: '#d97706',
    subtitle: 'Needs attention'
  },
]

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t) }, [])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map(s => (
            <StatCard
              key={s.title}
              title={s.title}
              value={s.value}
              delta={s.delta}
              deltaType={s.deltaType}
              icon={<span style={{ color: s.iconColor }}>{s.icon}</span>}
              iconBg={s.iconBg}
              subtitle={s.subtitle}
            />
          ))
        }
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        <div className="glass p-5 lg:col-span-2" style={{ borderRadius: 20 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title mb-0">Revenue Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Monthly performance</p>
            </div>
            <button className="btn-icon"><FiRefreshCw size={14} /></button>
          </div>
          {loading ? (
            <div className="skeleton rounded-xl" style={{ height: 220 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,112,145,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#revenueGrad)" dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Recent Orders</h3>
            <a href="/seller/orders" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              View all <FiArrowRight size={12} />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-3/4" />
                    <div className="skeleton h-2.5 w-1/2" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(o => (
                <div key={o.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl cursor-pointer"
                  style={{
                    background: 'rgba(99,102,241,0.03)',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.07)'
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.03)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{o.id}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{o.customer}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{o.amount}</span>
                    <span className={`badge ${statusStyle[o.status] || 'badge-neutral'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Top Products ─────────────────────────────────── */}
      <div className="glass p-5" style={{ borderRadius: 20 }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title mb-0">Top Selling Products</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>This month's best performers</p>
          </div>
          <a href="/seller/products" className="btn-ghost text-xs">
            <FiPackage size={13} /> View All
          </a>
        </div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="skeleton h-3 w-40" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{p.sales} sold</span>
                    <span className="font-semibold" style={{ color: 'var(--accent)' }}>{p.revenue}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"
                    style={{ width: `${p.pct}%`, background: 'linear-gradient(90deg, #6366f1, #0891b2)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
