import { apiRequest } from "./client";

// Delivery coverage (gate 2): the PIN-code catchments that decide which
// delivery partners can be matched to which seller warehouse.

export async function getCoverage() {
  return apiRequest("/coverage");
}

export async function createZone(zone) {
  const data = await apiRequest("/coverage", { method: "POST", body: JSON.stringify(zone) });
  return data.cluster;
}

export async function updateZone(id, updates) {
  const data = await apiRequest(`/coverage/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data.cluster;
}

export async function deleteZone(id) {
  return apiRequest(`/coverage/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// Which partners a given warehouse PIN can currently reach.
export async function previewCoverage(warehousePincode) {
  return apiRequest(`/coverage/preview?warehousePincode=${encodeURIComponent(warehousePincode)}`);
}
