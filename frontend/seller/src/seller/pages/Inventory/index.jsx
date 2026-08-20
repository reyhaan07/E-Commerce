import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import FilterBar from '../../components/ui/FilterBar'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import {
  FiLayers, FiCheck, FiChevronRight, FiAlertTriangle, FiXCircle, FiCheckCircle, FiX,
} from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const LOW = 5
const statusKey = (stock) => (stock === 0 ? 'Out of Stock' : stock <= LOW ? 'Low Stock' : 'In Stock')

export default function Inventory() {
  const { user } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [filter, setFilter] = useState('All')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  function refresh() {
    if (!user) return
    apiRequest('/products?sellerId=me&limit=48').then(d => setItems(d.products)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(refresh, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveStock(product) {
    const value = Number(drafts[product.id])
    if (!Number.isFinite(value) || value < 0) return
    setSavingId(product.id)
    try {
      await apiRequest(`/products/${product.id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock: value }) })
      toast.success(`${product.name} stock updated to ${value}`)
      setDrafts(d => ({ ...d, [product.id]: undefined }))
      refresh()
    } catch (err) { toast.error(err.message) }
    finally { setSavingId(null) }
  }

  const categories = useMemo(() => ['All', ...new Set(items.map(i => i.category))], [items])
  const stats = useMemo(() => {
    const totalStock = items.reduce((a, b) => a + b.stock, 0)
    const inStockUnits = items.filter(i => i.stock > LOW).reduce((a, b) => a + b.stock, 0)
    const counts = { All: items.length, 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 }
    items.forEach(i => { counts[statusKey(i.stock)]++ })
    return { totalStock, inStockUnits, counts, pctIn: totalStock ? ((inStockUnits / totalStock) * 100).toFixed(1) : 0 }
  }, [items])

  const filtered = useMemo(() => items.filter(i => {
    const q = query.toLowerCase()
    const matchQ = !q || i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q)
    const matchC = category === 'All' || i.category === category
    const matchF = filter === 'All' || statusKey(i.stock) === filter
    return matchQ && matchC && matchF
  }), [items, query, category, filter])

  useEffect(() => { setPage(1) }, [query, filter, category, pageSize])
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const filtersActive = query || filter !== 'All' || category !== 'All'

  const summary = [
    { label: 'Total Stock Units', value: stats.totalStock.toLocaleString(), sub: 'Across all products', icon: FiLayers, tint: ['var(--accent-soft)', 'var(--accent)'] },
    { label: 'In Stock', value: stats.inStockUnits.toLocaleString(), sub: `${stats.pctIn}% of total stock`, icon: FiCheckCircle, tint: ['var(--success-soft)', 'var(--success)'] },
    { label: 'Low Stock Items', value: stats.counts['Low Stock'], sub: 'Need restocking', icon: FiAlertTriangle, tint: ['var(--warning-soft)', 'var(--warning)'] },
    { label: 'Out of Stock', value: stats.counts['Out of Stock'], sub: 'Currently unavailable', icon: FiXCircle, tint: ['var(--danger-soft)', 'var(--danger)'] },
  ]
  const tabs = ['All', 'In Stock', 'Low Stock', 'Out of Stock']

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Inventory" subtitle="Track and manage stock levels for all your products." />

      {/* Summary */}
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

      {/* Filters */}
      <FilterBar>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name, SKU or placement…" />
        <select className="input h-10 w-full sm:w-48 shrink-0" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Placement' : c}</option>)}
        </select>
        {filtersActive && <button className="btn-ghost shrink-0" onClick={() => { setQuery(''); setFilter('All'); setCategory('All') }}><FiX size={15} /> Clear</button>}
      </FilterBar>

      {/* Status tabs */}
      <div className="seg flex-wrap">
        {tabs.map(t => (
          <button key={t} className={`seg-item${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
            {t} <span className="seg-count">{stats.counts[t]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiLayers />} title="No items match your filter"
          description="Try a different status filter or search keyword."
          action={filtersActive ? <button className="btn-ghost" onClick={() => { setQuery(''); setFilter('All'); setCategory('All') }}>Reset Filters</button> : null} />
      ) : (
        <>
          <DataTable minWidth={760} columns={[
            { key: 'product', label: 'Product' },
            { key: 'sku', label: 'SKU' },
            { key: 'placement', label: 'Placement' },
            { key: 'qty', label: 'Qty' },
            { key: 'status', label: 'Status' },
            { key: 'update', label: 'Update Stock' },
          ]}>
            {pageRows.map(item => {
              const key = statusKey(item.stock)
              const draft = drafts[item.id]
              const parts = [item.category, item.subcategory || item.productType].filter(Boolean)
              return (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={item.images?.[0]} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
                        onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                      <span className="font-semibold text-[13px] truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                    </div>
                  </td>
                  <td><code className="text-[11px] px-2 py-1 rounded-md" style={{ background: 'var(--surface-3)', color: 'var(--text-soft)' }}>{item.sku || '—'}</code></td>
                  <td>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {parts.map((p, i) => (<React.Fragment key={i}>{i > 0 && <FiChevronRight size={11} style={{ color: 'var(--text-faint)' }} />}<span>{p}</span></React.Fragment>))}
                    </div>
                  </td>
                  <td className="font-bold tnum" style={{ color: 'var(--text-primary)' }}>{item.stock}</td>
                  <td><StatusBadge status={key} /></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="0" className="input h-9 w-24 text-sm"
                        value={draft !== undefined ? draft : item.stock}
                        onChange={e => setDrafts(d => ({ ...d, [item.id]: e.target.value }))} />
                      <button className="btn-icon w-9 h-9" title="Save"
                        style={draft !== undefined && Number(draft) !== item.stock ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : undefined}
                        disabled={savingId === item.id || draft === undefined || Number(draft) === item.stock}
                        onClick={() => saveStock(item)}>
                        <FiCheck size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} noun="products" onPage={setPage} onPageSize={setPageSize} />
        </>
      )}
    </div>
  )
}
