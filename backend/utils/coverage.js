// Delivery catchment cache (gate 2).
//
// serviceability.js needs `getNearbyPincodes` to be synchronous — it is pure,
// database-free logic that runs inside request handlers and is unit-tested in
// isolation. The clusters themselves are now admin-editable and live in
// MongoDB, so this module keeps them in memory and is refreshed whenever an
// admin changes one.
//
// Until the cache is loaded (unit tests, or before the first DB read) every
// lookup falls back to the static map in data/pincodes.js, so behaviour is
// identical to before this was made editable.

const { PIN_CLUSTERS, NEARBY_PINCODES: STATIC_NEARBY, normalizePincode } = require("../data/pincodes");

let nearby = null; // { [pin]: [pin, ...] } once loaded from the database
let clusters = []; // the raw cluster documents, for callers that need them

// Build the symmetric near-map: every PIN in a cluster is near the rest of
// that cluster, including itself.
function buildNearby(rows) {
  const map = {};
  for (const row of rows) {
    const pins = (row.near || []).map(normalizePincode).filter(Boolean);
    for (const pin of pins) {
      map[pin] = [...new Set([...(map[pin] || []), ...pins])];
    }
  }
  return map;
}

// Seeds the collection from data/pincodes.js the first time, then caches.
// Idempotent — safe to call on every boot.
async function loadCoverage() {
  const { PincodeCluster } = require("../models/pincodeCluster.model");

  if ((await PincodeCluster.countDocuments()) === 0) {
    await PincodeCluster.insertMany(
      PIN_CLUSTERS.map((c, i) => ({
        id: `zone-${i + 1}`,
        city: c.city,
        hub: c.hub,
        near: c.near,
        outliers: c.outliers || [],
      }))
    );
  }

  clusters = await PincodeCluster.find().sort({ city: 1 }).lean();
  nearby = buildNearby(clusters);
  return clusters;
}

// Call after any admin write so the next request sees the new catchment
// without a restart.
async function refreshCoverage() {
  const { PincodeCluster } = require("../models/pincodeCluster.model");
  clusters = await PincodeCluster.find().sort({ city: 1 }).lean();
  nearby = buildNearby(clusters);
  return clusters;
}

// Synchronous lookup. A PIN we have no mapping for is near only itself —
// never guessed from arithmetic distance.
function getNearbyPincodes(pin) {
  const key = normalizePincode(pin);
  if (!key) return [];
  const map = nearby || STATIC_NEARBY;
  return map[key] || [key];
}

function getClusters() {
  return clusters;
}

module.exports = { loadCoverage, refreshCoverage, getNearbyPincodes, getClusters };
