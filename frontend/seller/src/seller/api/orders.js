import { apiRequest } from './client'

export async function getOrders() {
  const data = await apiRequest('/orders')
  return data.orders
}

export async function updateSellerStatus(orderId, sellerStatus) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/seller-status`, {
    method: 'PATCH',
    body: JSON.stringify({ sellerStatus }),
  })
  return data.order
}
