import { apiRequest } from "./client";

export async function getDeliveryPartners() {
  const data = await apiRequest("/delivery-partners");
  return data.deliveryPartners;
}

export async function addDeliveryPartner(partner) {
  const data = await apiRequest("/delivery-partners", {
    method: "POST",
    body: JSON.stringify(partner),
  });
  return data.deliveryPartner;
}

export async function updateDeliveryPartner(id, updates) {
  const data = await apiRequest(`/delivery-partners/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.deliveryPartner;
}

export async function removeDeliveryPartner(id) {
  await apiRequest(`/delivery-partners/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
