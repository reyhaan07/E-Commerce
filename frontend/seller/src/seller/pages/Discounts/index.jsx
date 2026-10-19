import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import FilterBar from '../../components/ui/FilterBar'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import { FiTag, FiPercent, FiTrendingDown, FiDollarSign, FiX, FiPlus, FiMinus, FiCheck } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const LOW = 5
function inr(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}` }

function discountOf(p) {
  if (p.discount && p.discount > 0) return p.discount
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
  const [tabFilter, setTabFilter] = useState('all') // 'all' | 'discounted'
  const [updatingId, setUpdatingId] = useState(null)
  const [successToast, setSuccessToast] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (!user) return
    apiRequest('/products?sellerId=me&limit=48')
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const onSale = useMemo(() => products.filter(p => discountOf(p) > 0), [products])
  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products])

  const stats = useMemo(() => {
    if (onSale.length === 0) return { count: 0, avg: 0, max: 0, markdown: 0 }
    const discounts = onSale.map(discountOf)
    const markdown = onSale.reduce((s, p) => s + (p.oldPrice ? p.oldPrice - p.price : 0), 0)
    return {
      count: onSale.length,
      avg: Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length),
      max: Math.max(...discounts),
      markdown,
    }
  }, [onSale])

  async function adjustDiscount(productId, nextDiscount) {
    const clamped = Math.max(0, Math.min(90, Math.round(nextDiscount)))
    setUpdatingId(productId)
    try {
      const res = await apiRequest(`/products/${productId}/discount`, {
        method: 'PATCH',
        body: JSON.stringify({ discount: clamped }),
      })
      if (res.success && res.product) {
        setProducts(current => current.map(p => p.id === productId ? res.product : p))
        setSuccessToast(`Discount updated to ${clamped}% for ${res.product.name}`)
        setTimeout(() => setSuccessToast(''), 3000)
      }
    } catch (err) {
      alert(err.message || 'Failed to update discount')
    } finally {
      setUpdatingId(null)
    }
  }

  const baseList = tabFilter === 'discounted' ? onSale : products

  const filtered = useMemo(() => baseList.filter(p => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    return matchQ && (category === 'All' || p.category === category)
  }).sort((a, b) => discountOf(b) - discountOf(a)), [baseList, query, category])

  useEffect(() => { setPage(1) }, [query, category, tabFilter, pageSize])
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
      <PageHeader
        title="Discounts & Markdowns"
        subtitle="Increase or decrease product discounts dynamically to drive sales."
      />

      {successToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-medium flex items-center gap-2">
          <FiCheck className="text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : summary.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-2.5">
              <div className="stat-icon" style={{ background: s.tint[0], color: s.tint[1] }}><s.icon size={18} /></div>
              <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
            <div>
              <p className="text-[26px] leading-none font-bold tnum" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tabFilter === 'all' ? 'bg-[var(--accent)] text-white' : 'btn-ghost text-[var(--text-muted)]'}`}
          >
            All Catalog Items ({products.length})
          </button>
          <button
            onClick={() => setTabFilter('discounted')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tabFilter === 'discounted' ? 'bg-[var(--accent)] text-white' : 'btn-ghost text-[var(--text-muted)]'}`}
          >
            On Sale Only ({onSale.length})
          </button>
        </div>
      </div>

      <FilterBar>
        <SearchBar value={query} onChange={setQuery} placeholder="Search product name or SKU…" />
        <select className="input h-10 w-full sm:w-48 shrink-0" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        {filtersActive && <button className="btn-ghost shrink-0" onClick={() => { setQuery(''); setCategory('All') }}><FiX size={15} /> Clear</button>}
      </FilterBar>

      {loading ? <SkeletonTable rows={8} /> : filtered.length === 0 ? (
        <EmptyState
          icon={<FiTag />}
          title="No products found"
          description={tabFilter === 'discounted' ? 'No products currently have active discounts. Switch to All Catalog Items to set discounts.' : 'No products match your filter.'}
        />
      ) : (
        <>
          <DataTable minWidth={880} columns={[
            { key: 'product', label: 'Product' },
            { key: 'cat', label: 'Category' },
            { key: 'mrp', label: 'Base MRP' },
            { key: 'price', label: 'Selling Price' },
            { key: 'adjust', label: 'Discount Controller', align: 'center' },
            { key: 'save', label: 'Savings' },
            { key: 'status', label: 'Status' },
          ]}>
            {pageRows.map(p => {
              const disc = discountOf(p)
              const [key, label] = stockStatus(p)
              const mrp = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price
              const isUpdating = updatingId === p.id

              return (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
                        onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sku || p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</td>
                  <td className="text-sm tnum font-medium" style={{ color: disc > 0 ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: disc > 0 ? 'line-through' : 'none' }}>
                    {inr(mrp)}
                  </td>
                  <td className="font-bold tnum text-sm" style={{ color: disc > 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {inr(p.price)}
                  </td>
                  <td className="text-center">
                    <div className="inline-flex flex-col items-center gap-1.5 py-1">
                      <div className="inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1">
                        <button
                          type="button"
                          disabled={disc <= 0 || isUpdating}
                          onClick={() => adjustDiscount(p.id, disc - 5)}
                          title="Decrease discount by 5%"
                          className="w-7 h-7 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-14 text-center font-bold text-xs tnum" style={{ color: disc > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {isUpdating ? '...' : `${disc}%`}
                        </span>
                        <button
                          type="button"
                          disabled={disc >= 90 || isUpdating}
                          onClick={() => adjustDiscount(p.id, disc + 5)}
                          title="Increase discount by 5%"
                          className="w-7 h-7 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {[0, 10, 25, 50].map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isUpdating || disc === val}
                            onClick={() => adjustDiscount(p.id, val)}
                            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${disc === val ? 'bg-[var(--accent)] text-white font-bold' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                          >
                            {val === 0 ? 'Off' : `${val}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="font-semibold tnum text-xs" style={{ color: disc > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {disc > 0 ? inr(mrp - p.price) : '—'}
                  </td>
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
