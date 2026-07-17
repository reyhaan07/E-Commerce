import React, { useState, useEffect, useMemo } from 'react'
import EmptyState from '../../components/EmptyState'
import { SkeletonProductGrid } from '../../components/Skeleton'
import { FiPlus, FiSearch, FiBox, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

const EMPTY_FORM = {
  name: '', brand: '', category: '', subcategory: '', productType: '',
  price: '', oldPrice: '', stock: '', sku: '', image: '', description: '',
}

export default function Products() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [tree, setTree] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null) // null = closed, {...EMPTY_FORM, id?} = open
  const [feedback, setFeedback] = useState(null) // { text, error }

  async function refresh() {
    if (!user) return
    try {
      const data = await apiRequest('/products?sellerId=me&limit=48')
      setProducts(data.products)
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    apiRequest('/products/categories').then((d) => setTree(d.tree)).catch(() => {})
  }, [])

  const myCategories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products])
  const filtered = products.filter(p => {
    const matchQ = p.name.toLowerCase().includes(query.toLowerCase())
    const matchC = category === 'All' || p.category === category
    return matchQ && matchC
  })

  // cascading dropdown options driven by the canonical taxonomy
  const activeCategory = tree.find(c => c.name === form?.category)
  const activeSubcategory = activeCategory?.subcategories.find(s => s.name === form?.subcategory)

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
    setForm((f) => {
      const next = { ...f, [key]: value }
      if (key === 'category') { next.subcategory = ''; next.productType = '' }
      if (key === 'subcategory') next.productType = ''
      return next
    })
  }

  async function save(e) {
    e.preventDefault()
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
        setFeedback({ text: `${form.name} updated` })
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(body) })
        setFeedback({ text: `${form.name} created — it will appear in the storefront once an admin approves it` })
      }
      setForm(null)
      refresh()
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return
    try {
      await apiRequest(`/products/${p.id}`, { method: 'DELETE' })
      setFeedback({ text: `${p.name} deleted` })
      refresh()
    } catch (err) {
      setFeedback({ text: err.message, error: true })
    }
  }

  const badge = (p) => p.approvalStatus === 'Approved'
    ? (p.stock === 0 ? ['badge-danger', 'Out of Stock'] : p.stock <= 5 ? ['badge-warning', `Low Stock (${p.stock})`] : ['badge-success', 'Live'])
    : p.approvalStatus === 'Pending' ? ['badge-warning', 'Awaiting Approval'] : ['badge-danger', 'Rejected']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{products.length} products in your store</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><FiPlus size={15} /> Add Product</button>
      </div>

      {feedback && (
        <div className="glass p-3 text-sm font-medium" style={{ borderRadius: 12, color: feedback.error ? '#e11d48' : '#059669' }}>
          {feedback.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="glass p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ borderRadius: 16 }}>
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search products…" className="input pl-9 h-9 text-sm"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="input h-9 text-sm w-full sm:w-56" value={category} onChange={e => setCategory(e.target.value)}>
          {myCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Add / Edit form with cascading taxonomy dropdowns */}
      {form && (
        <form onSubmit={save} className="glass p-5 space-y-4" style={{ borderRadius: 20 }}>
          <p className="text-sm font-semibold">{form.id ? `Edit ${form.id}` : 'Add a new product'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required className="input" placeholder="Product name" value={form.name} onChange={e => setField('name', e.target.value)} />
            <input className="input" placeholder="Brand" value={form.brand} onChange={e => setField('brand', e.target.value)} />
            <select required className="input" value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">Category…</option>
              {tree.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select required className="input" value={form.subcategory} onChange={e => setField('subcategory', e.target.value)} disabled={!activeCategory}>
              <option value="">Subcategory…</option>
              {activeCategory?.subcategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <select required className="input" value={form.productType} onChange={e => setField('productType', e.target.value)} disabled={!activeSubcategory}>
              <option value="">Product type…</option>
              {activeSubcategory?.productTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input required type="number" min="0" className="input" placeholder="Price (₹)" value={form.price} onChange={e => setField('price', e.target.value)} />
            <input type="number" min="0" className="input" placeholder="Old price (optional)" value={form.oldPrice} onChange={e => setField('oldPrice', e.target.value)} />
            <input required type="number" min="0" className="input" placeholder="Stock" value={form.stock} onChange={e => setField('stock', e.target.value)} />
            <input className="input" placeholder="SKU" value={form.sku} onChange={e => setField('sku', e.target.value)} />
            <input className="input" placeholder="Image URL" value={form.image} onChange={e => setField('image', e.target.value)} />
          </div>
          <textarea className="input w-full" rows={3} placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} />
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary">{form.id ? 'Save Changes' : 'Create Product'}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Product table */}
      {loading ? (
        <SkeletonProductGrid count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FiBox />}
          title="No products found"
          description="Try adjusting your search, or add your first product."
          action={<button className="btn-primary" onClick={() => { setQuery(''); setCategory('All') }}>Clear Filters</button>}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Product</th><th>Placement</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const [cls, label] = badge(p)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" style={{ border: '1px solid var(--border)', background: '#f8fafc' }} />
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.sku} · ★{p.rating || '—'} ({p.ratingCount})</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs">{p.category}{p.subcategory ? ` → ${p.subcategory}` : ''}{p.productType ? ` → ${p.productType}` : ''}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{p.price}</td>
                    <td>{p.stock}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-icon" title="Edit" style={{ width: 28, height: 28 }} onClick={() => openEdit(p)}><FiEdit2 size={13} /></button>
                        <button className="btn-icon" title="Delete" style={{ width: 28, height: 28, color: '#e11d48', borderColor: 'rgba(225,29,72,0.2)' }} onClick={() => remove(p)}><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
