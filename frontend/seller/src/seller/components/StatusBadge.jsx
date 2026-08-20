import React from 'react'

// One badge component for every status across the Seller Center — product,
// order (seller), inventory and delivery — so colours stay consistent.
const STATUS_CLASS = {
  // Product / catalog / account
  Live: 'badge-success',
  Approved: 'badge-success',
  Verified: 'badge-success',
  Active: 'badge-success',
  'Awaiting Approval': 'badge-warning',
  Pending: 'badge-warning',
  Draft: 'badge-neutral',
  // Inventory
  'In Stock': 'badge-success',
  'Low Stock': 'badge-warning',
  'Out of Stock': 'badge-danger',
  // Order (seller lifecycle)
  Processing: 'badge-info',
  Accepted: 'badge-accent',
  Packed: 'badge-warning',
  'Ready For Dispatch': 'badge-warning',
  Shipped: 'badge-violet',
  Delivered: 'badge-success',
  Returned: 'badge-danger',
  Cancelled: 'badge-neutral',
  Rejected: 'badge-danger',
  Suspended: 'badge-danger',
  // Delivery lifecycle
  Assigned: 'badge-info',
  'Picked Up': 'badge-warning',
  'In Transit': 'badge-warning',
  'Out For Delivery': 'badge-accent',
  // Serviceability / area
  'Same area': 'badge-success',
  'Nearby area': 'badge-info',
}

export default function StatusBadge({ status, label, fallback = 'Not Assigned', dot = false, className = '' }) {
  const text = label ?? status ?? fallback
  const cls = status ? (STATUS_CLASS[status] || 'badge-neutral') : 'badge-neutral'
  return (
    <span className={`badge ${cls} ${dot ? 'badge-dot' : ''} ${className}`}>{text}</span>
  )
}
