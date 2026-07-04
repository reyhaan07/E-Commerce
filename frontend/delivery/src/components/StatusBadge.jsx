import React from 'react'

// Renders a badge for one of the 6 delivery statuses (or "Not Assigned" when null).
// Copied into Admin/Seller/User as well so all 4 apps render delivery status consistently.
const STYLES = {
  Assigned:          'badge-info',
  Accepted:          'badge-accent',
  'Picked Up':       'badge-warning',
  'In Transit':      'badge-warning',
  'Out For Delivery':'badge-accent',
  Delivered:         'badge-success',
}

export default function StatusBadge({ status }) {
  if (!status) {
    return <span className="badge badge-neutral">Not Assigned</span>
  }
  return <span className={`badge ${STYLES[status] || 'badge-neutral'}`}>{status}</span>
}
