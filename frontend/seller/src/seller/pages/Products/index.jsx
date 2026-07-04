import React, { useState, useEffect } from 'react'
import ProductCard from '../../components/cards/ProductCard'
import EmptyState from '../../components/EmptyState'
import { SkeletonProductGrid } from '../../components/Skeleton'
import { FiPlus, FiSearch, FiGrid, FiList, FiFilter, FiChevronDown, FiBox } from 'react-icons/fi'

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home & Living', 'Sports', 'Beauty']

const sample = [
  { id: 1, name: 'Wireless Headphones Pro', category: 'Electronics', price: 129, stock: 14,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Smart Watch Series X', category: 'Electronics', price: 299, stock: 3,
    image: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41e8?auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Linen Casual Shirt', category: 'Clothing', price: 49, stock: 0,
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Bamboo Desk Organizer', category: 'Home & Living', price: 34, stock: 22,
    image: 'https://images.unsplash.com/photo-1512499617640-c2f99990672c?auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Running Shoes Ultra', category: 'Sports', price: 189, stock: 7,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Skincare Glow Kit', category: 'Beauty', price: 79, stock: 0,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80' },
  { id: 7, name: 'Noise-Cancel Earbuds', category: 'Electronics', price: 89, stock: 5,
    image: 'https://images.unsplash.com/photo-1517502166878-35c93a0072bb?auto=format&fit=crop&w=400&q=80' },
  { id: 8, name: 'Yoga Mat Premium', category: 'Sports', price: 55, stock: 18,
    image: 'https://images.unsplash.com/photo-1599058917764-602b97aa2047?auto=format&fit=crop&w=400&q=80' },
  { id: 9, name: 'Coffee Grinder Pro', category: 'Home & Living', price: 64, stock: 9,
    image: 'https://images.unsplash.com/photo-1511381939415-8af74912c8ab?auto=format&fit=crop&w=400&q=80' },
  { id: 10, name: 'Graphic Tee Vintage', category: 'Clothing', price: 28, stock: 0,
    image: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5d6?auto=format&fit=crop&w=400&q=80' },
  { id: 11, name: 'USB-C Hub 7-Port', category: 'Electronics', price: 45, stock: 33,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80' },
  { id: 12, name: 'Face Serum Vitamin C', category: 'Beauty', price: 42, stock: 4,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80' },
]

export default function Products() {
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('seller_products')
      return raw ? JSON.parse(raw) : sample
    } catch (e) {
      return sample
    }
  })
  const [view,     setView]     = useState('grid')
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')
  const [loading,  setLoading]  = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [editImage, setEditImage] = useState('')
  const [previewValid, setPreviewValid] = useState(true)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [viewProduct, setViewProduct] = useState(null)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t) }, [])

  // Persist products to localStorage so edits survive refresh
  useEffect(() => {
    try {
      localStorage.setItem('seller_products', JSON.stringify(products))
    } catch (e) {
      // ignore storage errors
    }
  }, [products])

  const filtered = products.filter(p => {
    const matchQ = p.name.toLowerCase().includes(query.toLowerCase())
    const matchC = category === 'All' || p.category === category
    return matchQ && matchC
  })

  const startEdit = product => {
    setEditProduct(product)
    setEditImage(product.image || '')
  }

  const saveImage = () => {
    if (!editProduct) return
    setProducts(products.map(p => p.id === editProduct.id ? { ...p, image: editImage || p.image } : p))
    setEditProduct(null)
    setEditImage('')
  }

  // validate preview image URL
  useEffect(() => {
    if (!editImage) return setPreviewValid(true)
    let mounted = true
    const img = new Image()
    img.onload = () => { if (mounted) setPreviewValid(true) }
    img.onerror = () => { if (mounted) setPreviewValid(false) }
    img.src = editImage
    return () => { mounted = false }
  }, [editImage])

  const handleFileChange = e => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setEditImage(dataUrl)
      setUploadPreview(dataUrl)
      setPreviewValid(true)
    }
    reader.readAsDataURL(file)
  }

  const cancelEdit = () => {
    setEditProduct(null)
    setEditImage('')
  }

  const startView = product => setViewProduct(product)
  const closeView = () => setViewProduct(null)

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="page-subtitle">{products.length} total products</p>
        </div>
        <button className="btn-primary"><FiPlus size={15} /> Add Product</button>
      </div>

      {/* Toolbar */}
      <div className="glass p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ borderRadius: 16 }}>
        <div className="relative flex-1">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search products…" className="input pl-9 h-9 text-sm"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {/* Category dropdown */}
        <div className="relative">
          <button className="btn-ghost h-9 text-sm gap-2 w-full sm:w-auto"
            onClick={() => setFiltersOpen(o => !o)}>
            <FiFilter size={14} /> {category} <FiChevronDown size={14} />
          </button>
          {filtersOpen && (
            <div className="absolute right-0 top-11 z-30 py-1 min-w-[160px] animate-scale-in"
              style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 14,
                boxShadow: 'var(--shadow-lg)'
              }}>
              {CATEGORIES.map(c => (
                <button key={c} className="block w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: c === category ? 'var(--accent)' : 'var(--text-soft)',
                    background: c === category ? 'rgba(99,102,241,0.06)' : 'transparent',
                    fontWeight: c === category ? 600 : 400,
                  }}
                  onClick={() => { setCategory(c); setFiltersOpen(false) }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: '#f1f5f9', border: '1px solid var(--border)' }}>
          {[['grid', FiGrid], ['list', FiList]].map(([v, Icon]) => (
            <button key={v}
              className="flex items-center justify-center w-8 h-7 rounded-lg transition-all duration-200"
              style={{
                background: view === v ? 'white' : 'transparent',
                color: view === v ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => setView(v)}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {editProduct && (
        <div className="glass p-4 flex flex-col sm:flex-row items-stretch gap-3" style={{ borderRadius: 20 }}>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2">Edit image for: <span className="text-accent">{editProduct.name}</span></p>
            <input
              type="text"
              placeholder="Paste a direct image URL"
              className="input w-full"
              value={editImage}
              onChange={e => setEditImage(e.target.value)}
            />
            <div className="flex items-center gap-3 mt-3">
              <div style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: '#f8fafc' }}>
                {editImage ? (
                  previewValid ? (
                    <img src={editImage} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center text-xs text-red-500 w-full h-full">Invalid image</div>
                  )
                ) : (
                  <img src={editProduct.image} alt="current" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted">Preview</p>
                {!previewValid && editImage && <p className="text-xs text-red-500">Cannot load image from the URL.</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Upload image
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {uploadPreview && <button className="btn-ghost" onClick={() => { setUploadPreview(null); setEditImage(editProduct.image || ''); }}>Revert upload</button>}
            </div>
            <p className="text-xs text-muted mt-2">Enter an image URL to update the product image. If the URL is invalid, it will fall back to a placeholder image.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={saveImage} disabled={!!editImage && !previewValid}>Save Image</button>
            <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      )}

      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={closeView} />
          <div className="relative bg-white rounded-lg overflow-hidden" style={{ width: 'min(90vw,800px)', maxHeight: '90vh' }}>
            <button className="btn-ghost" style={{ position: 'absolute', right: 8, top: 8 }} onClick={closeView}>Close</button>
            <img src={viewProduct.image} alt={viewProduct.name} style={{ display: 'block', maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            <div className="p-3"><p className="font-semibold">{viewProduct.name}</p></div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Filters + Content */}
      <div className="flex gap-4">
        {/* Sidebar filters — desktop only */}
        <aside className="hidden lg:block w-52 shrink-0 space-y-4">
          <div className="glass p-4" style={{ borderRadius: 16 }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Categories</h4>
            <div className="space-y-1">
              {CATEGORIES.map(c => (
                <button key={c} className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 font-medium"
                  style={{
                    background: category === c ? 'rgba(99,102,241,0.08)' : 'transparent',
                    color: category === c ? 'var(--accent)' : 'var(--text-muted)',
                    border: category === c ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
                  }}
                  onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-4" style={{ borderRadius: 16 }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Stock Status</h4>
            <div className="space-y-2">
              {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-soft)' }}>
                  <input type="checkbox" defaultChecked={s === 'All'} className="accent-indigo-500 rounded" />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="glass p-4" style={{ borderRadius: 16 }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Price Range</h4>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="input text-xs h-8 px-2" />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input type="number" placeholder="Max" className="input text-xs h-8 px-2" />
            </div>
          </div>
        </aside>

        {/* Product grid / table */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <SkeletonProductGrid count={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<FiBox />}
              title="No products found"
              description="Try adjusting your search or filter to find what you're looking for."
              action={<button className="btn-primary" onClick={() => { setQuery(''); setCategory('All') }}>Clear Filters</button>}
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
              {filtered.map(p => <ProductCard key={p.id} product={p} onEdit={startEdit} onView={startView} />)}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const inStock = p.stock > 0
                    const low = p.stock > 0 && p.stock <= 5
                    return (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              style={{ border: '1px solid var(--border)' }} />
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td>{p.category}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{p.price}</td>
                        <td>{p.stock}</td>
                        <td><span className={`badge ${!inStock ? 'badge-danger' : low ? 'badge-warning' : 'badge-success'}`}>{!inStock ? 'Out of Stock' : low ? 'Low Stock' : 'In Stock'}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button className="btn-icon" style={{ width: 28, height: 28, fontSize: 12 }} onClick={() => startEdit(p)}>✏️</button>
                            <button className="btn-icon" style={{ width: 28, height: 28, fontSize: 12, color: '#e11d48', borderColor: 'rgba(225,29,72,0.2)' }}>🗑</button>
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
      </div>
    </div>
  )
}
