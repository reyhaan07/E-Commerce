import { apiRequest } from './client'

// scoped to one seller — the console must only ever see its own orders
export async function getOrders(sellerId) {
  const data = await apiRequest(`/orders?sellerId=${encodeURIComponent(sellerId)}`)
  return data.orders
}

export async function updateSellerStatus(orderId, sellerStatus) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/seller-status`, {
    method: 'PATCH',
    body: JSON.stringify({ sellerStatus }),
  })
  return data.order
}

export async function requestPickup(orderId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/request-pickup`, { method: 'PATCH' })
  return data.order
}

export async function confirmDelivery(orderId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/confirm-delivery`, { method: 'PATCH' })
  return data.order
}
