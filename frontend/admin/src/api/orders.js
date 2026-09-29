import { apiRequest } from "./client";

export async function getOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await apiRequest(query ? `/orders?${query}` : "/orders");
  return data.orders;
}

// Serviceability + eligible partners for one order. The backend does the PIN
// filtering; the assignment UI must never build its own partner list.
export async function getEligiblePartners(orderId) {
  return apiRequest(`/orders/${encodeURIComponent(orderId)}/eligible-partners`);
}

export async function assignDeliveryPartner(orderId, deliveryPartnerId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ deliveryPartnerId }),
  });
  return data.order;
}
