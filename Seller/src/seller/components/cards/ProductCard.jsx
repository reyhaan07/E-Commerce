import React, { useState } from 'react'
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi'

export default function ProductCard({ product, onEdit, onDelete, onView }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const inStock = product.stock > 0
  const lowStock = product.stock > 0 && product.stock <= 5

  return (
    <div
      className="group cursor-pointer"
      style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Image */}
      <div className="relative w-full h-44 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        {!imgLoaded && <div className="skeleton absolute inset-0" />}
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={e => { setImgLoaded(true); e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image' }}
        />
        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)' }}>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit?.(product) }}>
            <FiEdit2 size={15} />
          </button>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onView?.(product) }} title="View image">
            <FiEye size={15} />
          </button>
          <button
            className="btn-icon"
            style={{ borderColor: 'rgba(225,29,72,0.25)', color: '#e11d48' }}
            onClick={e => { e.stopPropagation(); onDelete?.(product) }}>
            <FiTrash2 size={15} />
          </button>
        </div>
        {/* Stock badge */}
        <div className="absolute top-2 right-2">
          {!inStock
            ? <span className="badge badge-danger">Out of Stock</span>
            : lowStock
            ? <span className="badge badge-warning">Low Stock</span>
            : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{product.category}</p>
        <h4 className="font-semibold text-sm leading-snug mb-3 truncate" style={{ color: 'var(--text-primary)' }}>
          {product.name}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: 'var(--accent)' }}>₹{product.price}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {inStock ? `${product.stock} left` : 'Sold out'}
          </span>
        </div>
      </div>
    </div>
  )
}
