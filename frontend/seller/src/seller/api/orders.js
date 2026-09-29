import { apiRequest } from './client'

// scoped to one seller — the console must only ever see its own orders
export async function getOrders(sellerId) {
  const data = await apiRequest(`/orders?sellerId=${encodeURIComponent(sellerId)}`)
  return data.orders
}

export async function updateSellerStatus(orderId, sellerStatus, note) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/seller-status`, {
    method: 'PATCH',
    body: JSON.stringify({ sellerStatus, note }),
  })
  return data.order
}

// The end-to-end timeline, computed by the backend so the seller console and
// the storefront always agree on what the steps are.
export async function getOrderJourney(orderId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}`)
  return { order: data.order, journey: data.journey }
}

export async function requestPickup(orderId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/request-pickup`, { method: 'PATCH' })
  return data.order
}

export async function confirmDelivery(orderId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/confirm-delivery`, { method: 'PATCH' })
  return data.order
}

// Part B — PIN-based delivery filtering. The backend returns serviceability
// first and, when serviceable, only the eligible (active + available +
// PIN-near) partners, each tagged Same area / Nearby area.
export async function getEligiblePartners(orderId) {
  return apiRequest(`/orders/${encodeURIComponent(orderId)}/eligible-partners`)
}

// Assign a partner. The backend re-validates serviceability + eligibility and
// rejects anything out of area, so a stale/forged partnerId can't slip through.
export async function assignPartner(orderId, deliveryPartnerId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ deliveryPartnerId }),
  })
  return data.order
}
