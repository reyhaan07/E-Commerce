import { apiRequest } from './client'

export async function getOrdersForPartner(deliveryPartnerId) {
  const data = await apiRequest(`/orders?deliveryPartnerId=${encodeURIComponent(deliveryPartnerId)}`)
  return data.orders
}

export async function getOrder(id) {
  const data = await apiRequest(`/orders/${encodeURIComponent(id)}`)
  return data.order
}

export async function updateDeliveryStatus(id, deliveryStatus) {
  const data = await apiRequest(`/orders/${encodeURIComponent(id)}/delivery-status`, {
    method: 'PATCH',
    body: JSON.stringify({ deliveryStatus }),
  })
  return data.order
}
