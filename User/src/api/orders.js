import { apiRequest } from './client';

export async function getOrder(id) {
  const data = await apiRequest(`/orders/${encodeURIComponent(id)}`);
  return data.order;
}
