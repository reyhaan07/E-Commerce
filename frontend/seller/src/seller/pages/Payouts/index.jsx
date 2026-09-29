import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton'
import { FiDollarSign, FiClock, FiCheckCircle, FiTrendingUp, FiDownload } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'

function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
const IN_FLIGHT = ['Accepted', 'Packed', 'Ready For Dispatch', 'Shipped']

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-bd)', borderRadius: 10, padding: '9px 12px', boxShadow: 'var(--shadow-lg)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--success)', fontWeight: 700 }}>{inr(payload[0].value)}</div>
    </div>
  )
}

export default function Payouts() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (!user) return
    apiRequest(`/orders?sellerId=${encodeURIComponent(user.id)}`).then(d => setOrders(d.orders)).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const d = useMemo(() => {
    const delivered = orders.filter(o => o.sellerStatus === 'Delivered')
    const inFlight = orders.filter(o => IN_FLIGHT.includes(o.sellerStatus))
    const totalEarnings = delivered.reduce((s, o) => s + o.amount, 0)
    const pending = inFlight.reduce((s, o) => s + o.amount, 0)
    const avg = delivered.length ? Math.round(totalEarnings / delivered.length) : 0

    const byMonth = {}
    for (const o of delivered) {
      const dt = new Date(o.createdAt)
      const key = dt.toLocaleString('en', { month: 'short', year: '2-digit' })
      byMonth[key] = byMonth[key] || { name: key, amount: 0, index: dt.getFullYear() * 12 + dt.getMonth() }
      byMonth[key].amount += o.amount
    }
    const series = Object.values(byMonth).sort((a, b) => a.index - b.index).slice(-8)

    const rows = [
      ...delivered.map(o => ({ ...o, settle: 'Settled' })),
      ...inFlight.map(o => ({ ...o, settle: 'Pending' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return { totalEarnings, pending, avg, deliveredCount: delivered.length, series, rows }
  }, [orders])

  useEffect(() => { setPage(1) }, [pageSize])
  const pageRows = d.rows.slice((page - 1) * pageSize, page * pageSize)
  const barColor = isDark ? '#34d399' : '#16a34a'

  function exportCsv() {
    const header = 'Order ID,Customer,Date,Method,Amount,Settlement\n'
    const rows = d.rows.map(o => [o.id, `"${o.customerName}"`, new Date(o.createdAt).toISOString().slice(0, 10), o.paymentMethod, o.amount, o.settle].join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([header + rows], { type: 'text/csv' })); a.download = 'shopsphere-payouts.csv'; a.click(); URL.revokeObjectURL(a.href)
  }

  const summary = [
    { label: 'Total Earnings', value: inr(d.totalEarnings), sub: 'From delivered orders', icon: FiDollarSign, tint: ['var(--success-soft)', 'var(--success)'] },
    { label: 'Pending Settlement', value: inr(d.pending), sub: 'Orders in progress', icon: FiClock, tint: ['var(--warning-soft)', 'var(--warning)'] },
    { label: 'Orders Settled', value: d.deliveredCount, sub: 'Delivered & paid', icon: FiCheckCircle, tint: ['var(--accent-soft)', 'var(--accent)'] },
    { label: 'Avg per Order', value: inr(d.avg), sub: 'Settled average', icon: FiTrendingUp, tint: ['var(--info-soft)', 'var(--info)'] },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Payouts" subtitle="Track your earnings and order settlements."
        actions={<button className="btn-ghost" onClick={exportCsv}><FiDownload size={15} /> Export</button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : summary.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon" style={{ background: s.tint[0], color: s.tint[1] }}><s.icon size={18} /></div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
            <div><p className="text-[22px] leading-none font-bold tnum truncate" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{s.sub}</p></div>
          </div>
        ))}
      </div>

      {/* Earnings chart */}
      <SectionCard title="Earnings Over Time" description="Settled earnings per month">
        <div style={{ width: '100%', height: 240 }}>
          {d.series.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={d.series} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} width={48} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="amount" fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>{loading ? 'Loading…' : 'No settled earnings yet.'}</div>}
        </div>
      </SectionCard>

      {/* Settlements table */}
      {loading ? <SkeletonTable rows={6} /> : d.rows.length === 0 ? (
        <EmptyState icon={<FiDollarSign />} title="No settlements yet" description="Earnings appear here once orders start moving through fulfilment." />
      ) : (
        <>
          <DataTable minWidth={760} columns={[
            { key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Customer' }, { key: 'date', label: 'Date' },
            { key: 'method', label: 'Method' }, { key: 'amount', label: 'Amount' }, { key: 'settle', label: 'Settlement' },
          ]}>
            {pageRows.map(o => (
              <tr key={o.id}>
                <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-ink)' }}>{o.id}</span></td>
                <td className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{o.customerName}</td>
                <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="text-xs" style={{ color: 'var(--text-soft)' }}>{o.paymentMethod}</td>
                <td className="font-semibold tnum" style={{ color: 'var(--text-primary)' }}>{inr(o.amount)}</td>
                <td><span className={`badge ${o.settle === 'Settled' ? 'badge-success' : 'badge-warning'}`}>{o.settle}</span></td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={d.rows.length} noun="settlements" onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </div>
  )
}
