import { apiRequest } from './client';

// Returns the order together with its end-to-end journey (seller phase +
// delivery phase). The journey is computed server-side so the storefront and
// the seller console never disagree about where an order is.
export async function getOrder(id) {
  const data = await apiRequest(`/orders/${encodeURIComponent(id)}`);
  return { order: data.order, journey: data.journey };
}
