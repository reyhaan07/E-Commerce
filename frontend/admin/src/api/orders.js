import { apiRequest } from "./client";

export async function getOrders() {
  const data = await apiRequest("/orders");
  return data.orders;
}

export async function assignDeliveryPartner(orderId, deliveryPartnerId) {
  const data = await apiRequest(`/orders/${encodeURIComponent(orderId)}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ deliveryPartnerId }),
  });
  return data.order;
}
