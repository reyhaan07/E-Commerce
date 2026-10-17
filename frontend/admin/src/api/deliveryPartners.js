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

// Account standing (suspend / reactivate / deactivate) — separate endpoint from
// updateDeliveryPartner so the operational `status` field is never confused
// with account access.
export async function setPartnerAccountStatus(id, accountStatus, reason) {
  const data = await apiRequest(`/delivery-partners/${encodeURIComponent(id)}/account-status`, {
    method: "PATCH",
    body: JSON.stringify({ accountStatus, reason }),
  });
  return data.deliveryPartner;
}

// Approve / reject a suspended partner's reinstatement request.
export async function reviewUnsuspensionRequest(id, decision, reason) {
  const data = await apiRequest(`/delivery-partners/${encodeURIComponent(id)}/unsuspension-request`, {
    method: "PATCH",
    body: JSON.stringify({ decision, reason }),
  });
  return data.deliveryPartner;
}
