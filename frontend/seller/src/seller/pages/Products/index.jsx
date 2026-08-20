import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import SectionCard from '../../components/ui/SectionCard'
import FilterBar from '../../components/ui/FilterBar'
import SearchBar from '../../components/ui/SearchBar'
import Pagination from '../../components/ui/Pagination'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton'
import {
  FiPlus, FiBox, FiEdit2, FiTrash2, FiChevronRight, FiPackage,
  FiCheckCircle, FiAlertTriangle, FiXCircle, FiX,
} from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const LOW = 5
const EMPTY_FORM = {
  name: '', brand: '', category: '', subcategory: '', productType: '',
  price: '', oldPrice: '', stock: '', sku: '', image: '', description: '',
}

// [statusKey, label] for a product row.
function statusOf(p) {
  if (p.approvalStatus === 'Pending') return ['Awaiting Approval', 'Awaiting Approval']
  if (p.approvalStatus === 'Rejected') return ['Rejected', 'Rejected']
  if (p.stock === 0) return ['Out of Stock', 'Out of Stock']
  if (p.stock <= LOW) return ['Low Stock', `Low Stock (${p.stock})`]
  return ['Live', 'Live']
}

function Placement({ p }) {
  const parts = [p.category, p.subcategory, p.productType].filter(Boolean)
  return (
    <div className="flex items-center gap-1 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <FiChevronRight size={11} style={{ color: 'var(--text-faint)' }} />}
          <span style={i === 0 ? { color: 'var(--text-soft)', fontWeight: 500 } : undefined}>{part}</span>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Products() {
  const { user } = useAuth()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [tree, setTree] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    if (!user) return
    try {
      const data = await apiRequest('/products?sellerId=me&limit=48')
      setProducts(data.products)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { apiRequest('/products/categories').then(d => setTree(d.tree)).catch(() => {}) }, [])

  // open the add-product modal when routed here with ?new=1
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm({ ...EMPTY_FORM })
      searchParams.delete('new'); setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products])

  const stats = useMemo(() => {
    const approved = products.filter(p => p.approvalStatus === 'Approved')
    const total = products.length
    const live = approved.filter(p => p.stock > LOW).length
    const low = approved.filter(p => p.stock > 0 && p.stock <= LOW).length
    const out = approved.filter(p => p.stock === 0).length
    return { total, live, low, out, livePct: total ? Math.round((live / total) * 100) : 0 }
  }, [products])

  const filtered = useMemo(() => products.filter(p => {
    const q = query.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) || (p.subcategory || '').toLowerCase().includes(q)
    const matchC = category === 'All' || p.category === category
    const matchS = status === 'All' || statusOf(p)[0] === status
    return matchQ && matchC && matchS
  }), [products, query, category, status])

  useEffect(() => { setPage(1) }, [query, status, category, pageSize])
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const filtersActive = query || status !== 'All' || category !== 'All'

  // ── form (add/edit) ──────────────────────────────────────────────────────
  const activeCat = tree.find(c => c.name === form?.category)
  const activeSub = activeCat?.subcategories.find(s => s.name === form?.subcategory)
  function openAdd() { setForm({ ...EMPTY_FORM }) }
  function openEdit(p) {
    setForm({
      id: p.id, name: p.name, brand: p.brand || '', category: p.category,
      subcategory: p.subcategory || '', productType: p.productType || '',
      price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      stock: String(p.stock), sku: p.sku || '', image: p.images?.[0] || '', description: p.description || '',
    })
  }
  function setField(key, value) {
    setForm(f => {
      const next = { ...f, [key]: value }
      if (key === 'category') { next.subcategory = ''; next.productType = '' }
      if (key === 'subcategory') next.productType = ''
      return next
    })
  }
  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const body = {
      name: form.name, brand: form.brand, category: form.category,
      subcategory: form.subcategory, productType: form.productType,
      price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stock: Number(form.stock), sku: form.sku,
      images: form.image ? [form.image] : [], description: form.description,
    }
    try {
      if (form.id) {
        await apiRequest(`/products/${form.id}`, { method: 'PUT', body: JSON.stringify(body) })
        toast.success(`${form.name} updated`)
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(body) })
        toast.success(`${form.name} created — visible in the storefront once an admin approves it`)
      }
      setForm(null); refresh()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }
  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await apiRequest(`/products/${toDelete.id}`, { method: 'DELETE' })
      toast.success(`${toDelete.name} deleted`)
      setToDelete(null); refresh()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const summary = [
    { label: 'Total Products', value: stats.total, sub: 'All listings', icon: FiPackage, tint: ['var(--accent-soft)', 'var(--accent)'] },
    { label: 'Live Products', value: stats.live, sub: `${stats.livePct}% of total`, icon: FiCheckCircle, tint: ['var(--success-soft)', 'var(--success)'] },
    { label: 'Low Stock', value: stats.low, sub: 'Needs attention', icon: FiAlertTriangle, tint: ['var(--warning-soft)', 'var(--warning)'] },
    { label: 'Out of Stock', value: stats.out, sub: 'Temporarily unavailable', icon: FiXCircle, tint: ['var(--danger-soft)', 'var(--danger)'] },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Products" subtitle="Manage and view all the products in your store."
        actions={<button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Product</button>} />

      {/* Summary cards */}
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
        <select className="input h-10 w-full sm:w-40 shrink-0" value={status} onChange={e => setStatus(e.target.value)}>
          {['All', 'Live', 'Low Stock', 'Out of Stock', 'Awaiting Approval', 'Rejected'].map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
        </select>
        <select className="input h-10 w-full sm:w-48 shrink-0" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Placement' : c}</option>)}
        </select>
        {filtersActive && (
          <button className="btn-ghost shrink-0" onClick={() => { setQuery(''); setStatus('All'); setCategory('All') }}>
            <FiX size={15} /> Clear
          </button>
        )}
      </FilterBar>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} /> : filtered.length === 0 ? (
        <EmptyState icon={<FiBox />} title="No products found"
          description={filtersActive ? 'Try adjusting your search or filters.' : 'Add your first product to get started.'}
          action={filtersActive
            ? <button className="btn-ghost" onClick={() => { setQuery(''); setStatus('All'); setCategory('All') }}>Clear Filters</button>
            : <button className="btn-primary" onClick={openAdd}><FiPlus size={16} /> Add Product</button>} />
      ) : (
        <>
          <DataTable minWidth={760} columns={[
            { key: 'product', label: 'Product' },
            { key: 'placement', label: 'Placement' },
            { key: 'price', label: 'Price' },
            { key: 'stock', label: 'Stock' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: 'Actions', align: 'right' },
          ]}>
            {pageRows.map(p => {
              const [key, label] = statusOf(p)
              return (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
                        onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] truncate max-w-[220px]" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><Placement p={p} /></td>
                  <td className="font-semibold tnum" style={{ color: 'var(--accent-ink)' }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="font-semibold tnum" style={{ color: 'var(--text-primary)' }}>{p.stock}</td>
                  <td><StatusBadge status={key} label={label} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="btn-icon w-8 h-8" title="Edit" onClick={() => openEdit(p)}><FiEdit2 size={13} /></button>
                      <button className="btn-icon danger w-8 h-8" title="Delete" onClick={() => setToDelete(p)}><FiTrash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </DataTable>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} noun="products"
            onPage={setPage} onPageSize={setPageSize} />
        </>
      )}

      {/* Add / Edit modal */}
      <AnimatePresence>
        {form && (
          <div className="fixed inset-0 z-[80] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
            <motion.div className="absolute inset-0" style={{ background: 'var(--overlay)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setForm(null)} />
            <motion.form onSubmit={save} className="relative card w-full max-w-2xl my-4"
              style={{ boxShadow: 'var(--shadow-pop)' }}
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} transition={{ duration: 0.16 }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{form.id ? 'Edit product' : 'Add a new product'}</h3>
                <button type="button" className="btn-icon w-8 h-8" onClick={() => setForm(null)}><FiX size={16} /></button>
              </div>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Product name" required>
                    <input required className="input" placeholder="e.g. LumeGlow Smart Bulb" value={form.name} onChange={e => setField('name', e.target.value)} />
                  </Field>
                  <Field label="Brand">
                    <input className="input" placeholder="Brand" value={form.brand} onChange={e => setField('brand', e.target.value)} />
                  </Field>
                  <Field label="Category" required>
                    <select required className="input" value={form.category} onChange={e => setField('category', e.target.value)}>
                      <option value="">Select category…</option>
                      {tree.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Subcategory" required>
                    <select required className="input" value={form.subcategory} onChange={e => setField('subcategory', e.target.value)} disabled={!activeCat}>
                      <option value="">Select subcategory…</option>
                      {activeCat?.subcategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Product type" required>
                    <select required className="input" value={form.productType} onChange={e => setField('productType', e.target.value)} disabled={!activeSub}>
                      <option value="">Select type…</option>
                      {activeSub?.productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="SKU">
                    <input className="input" placeholder="SKU-0000" value={form.sku} onChange={e => setField('sku', e.target.value)} />
                  </Field>
                  <Field label="Price (₹)" required>
                    <input required type="number" min="0" className="input" placeholder="0" value={form.price} onChange={e => setField('price', e.target.value)} />
                  </Field>
                  <Field label="Old price (₹)">
                    <input type="number" min="0" className="input" placeholder="Optional" value={form.oldPrice} onChange={e => setField('oldPrice', e.target.value)} />
                  </Field>
                  <Field label="Stock" required>
                    <input required type="number" min="0" className="input" placeholder="0" value={form.stock} onChange={e => setField('stock', e.target.value)} />
                  </Field>
                  <Field label="Image URL">
                    <input className="input" placeholder="https://…" value={form.image} onChange={e => setField('image', e.target.value)} />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea className="input" rows={3} placeholder="Describe the product…" value={form.description} onChange={e => setField('description', e.target.value)} />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Product'}</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!toDelete} title="Delete product?"
        message={toDelete ? `“${toDelete.name}” will be permanently removed. This cannot be undone.` : ''}
        confirmLabel="Delete" busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-soft)' }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </span>
      {children}
    </label>
  )
}
