import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import FilterBar from '../../components/ui/FilterBar'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import { FiTag, FiPercent, FiTrendingDown, FiDollarSign, FiX } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const LOW = 5
function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }
function discountOf(p) {
  if (!p.oldPrice || p.oldPrice <= p.price) return 0
  return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
}
function stockStatus(p) {
  if (p.approvalStatus !== 'Approved') return ['Awaiting Approval', 'Awaiting Approval']
  if (p.stock === 0) return ['Out of Stock', 'Out of Stock']
  if (p.stock <= LOW) return ['Low Stock', `Low Stock (${p.stock})`]
  return ['Live', 'Live']
}

export default function Discounts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (!user) return
    apiRequest('/products?sellerId=me&limit=48').then(d => setProducts(d.products)).catch(() => {}).finally(() => setLoading(false))
  }, [user])

  const onSale = useMemo(() => products.filter(p => discountOf(p) > 0), [products])
  const categories = useMemo(() => ['All', ...new Set(onSale.map(p => p.category))], [onSale])

  const stats = useMemo(() => {
    if (onSale.length === 0) return { count: 0, avg: 0, max: 0, markdown: 0 }
    const discounts = onSale.map(discountOf)
    const markdown = onSale.reduce((s, p) => s + (p.oldPrice - p.price), 0)
    return {
      count: onSale.length,
      avg: Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length),
      max: Math.max(...discounts),
      markdown,
    }
  }, [onSale])

  const filtered = useMemo(() => onSale.filter(p => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    return matchQ && (category === 'All' || p.category === category)
  }).sort((a, b) => discountOf(b) - discountOf(a)), [onSale, query, category])

  useEffect(() => { setPage(1) }, [query, category, pageSize])
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const filtersActive = query || category !== 'All'

  const summary = [
    { label: 'Products on Sale', value: stats.count, sub: 'Active markdowns', icon: FiTag, tint: ['var(--accent-soft)', 'var(--accent)'] },
    { label: 'Average Discount', value: `${stats.avg}%`, sub: 'Across sale items', icon: FiPercent, tint: ['var(--success-soft)', 'var(--success)'] },
    { label: 'Highest Discount', value: `${stats.max}%`, sub: 'Best deal live', icon: FiTrendingDown, tint: ['var(--warning-soft)', 'var(--warning)'] },
    { label: 'Total Markdown', value: inr(stats.markdown), sub: 'Per-unit savings', icon: FiDollarSign, tint: ['var(--violet-soft)', 'var(--violet)'] },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Discounts" subtitle="Products currently marked down in your store." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : summary.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon" style={{ background: s.tint[0], color: s.tint[1] }}><s.icon size={18} /></div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
            <div><p className="text-[26px] leading-none font-bold tnum" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{s.sub}</p></div>
          </div>
        ))}
      </div>

      <FilterBar>
        <SearchBar value={query} onChange={setQuery} placeholder="Search discounted products…" />
        <select className="input h-10 w-full sm:w-48 shrink-0" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Placement' : c}</option>)}
        </select>
        {filtersActive && <button className="btn-ghost shrink-0" onClick={() => { setQuery(''); setCategory('All') }}><FiX size={15} /> Clear</button>}
      </FilterBar>

      {loading ? <SkeletonTable rows={8} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiTag />} title="No discounted products"
          description={onSale.length === 0 ? 'Set an “old price” higher than the price on a product to create a markdown.' : 'No products match your search.'} />
      ) : (
        <>
          <DataTable minWidth={820} columns={[
            { key: 'product', label: 'Product' }, { key: 'cat', label: 'Category' },
            { key: 'mrp', label: 'MRP' }, { key: 'price', label: 'Sale Price' },
            { key: 'disc', label: 'Discount', align: 'center' }, { key: 'save', label: 'You Save' },
            { key: 'status', label: 'Status' },
          ]}>
            {pageRows.map(p => {
              const disc = discountOf(p)
              const [key, label] = stockStatus(p)
              return (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }} onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] truncate max-w-[220px]" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</td>
                  <td className="text-sm tnum" style={{ color: 'var(--text-faint)', textDecoration: 'line-through' }}>{inr(p.oldPrice)}</td>
                  <td className="font-semibold tnum" style={{ color: 'var(--text-primary)' }}>{inr(p.price)}</td>
                  <td className="text-center"><span className="badge badge-success">{disc}% OFF</span></td>
                  <td className="font-semibold tnum" style={{ color: 'var(--success)' }}>{inr(p.oldPrice - p.price)}</td>
                  <td><StatusBadge status={key} label={label} /></td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} noun="deals" onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </div>
  )
}
