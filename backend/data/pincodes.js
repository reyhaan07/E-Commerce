// ─────────────────────────────────────────────────────────────────────────
// PIN-code serviceability configuration for ShopSphere.
//
// Proximity between PIN codes is expressed as an *explicit, editable mapping*,
// never inferred from the numeric difference between two PINs (PIN codes are
// identifiers, not coordinates). There is deliberately no GPS / lat-long /
// geocoding anywhere in this system.
//
// Each cluster groups the PINs that belong to one delivery catchment. From
// these lists the module derives:
//   • NEARBY_PINCODES — a symmetric map: every PIN in a cluster is "near" the
//     rest of that cluster (including itself).
//   • CITY_HUBS       — the representative hub PIN for a city, used to seed a
//     seller's warehouse PIN.
//
// To extend coverage later, add a cluster (or add PINs to an existing one) —
// the helpers below pick the change up automatically.
// ─────────────────────────────────────────────────────────────────────────

// `near`      → PINs treated as one delivery catchment (nearby to each other).
// `outliers`  → PINs in the same city that are deliberately OUTSIDE the
//               catchment. They exist so the "same city but not serviceable /
//               not nearby" path is reachable in the demo world and in tests.
const PIN_CLUSTERS = [
  { city: "Chennai",   hub: "600100", near: ["600100", "600096", "600073"], outliers: ["600042"] },
  { city: "Mumbai",    hub: "400001", near: ["400001", "400050", "400058"], outliers: ["400703"] },
  { city: "Delhi",     hub: "110001", near: ["110001", "110017", "110024"], outliers: ["110092"] },
  { city: "Bengaluru", hub: "560001", near: ["560001", "560034", "560066"], outliers: ["560100"] },
  { city: "Hyderabad", hub: "500001", near: ["500001", "500032", "500081"], outliers: ["500090"] },
  { city: "Pune",      hub: "411001", near: ["411001", "411014", "411028"], outliers: ["411045"] },
  { city: "Jaipur",    hub: "302001", near: ["302001", "302012", "302017"], outliers: ["302039"] },
  { city: "Kolkata",   hub: "700001", near: ["700001", "700016", "700091"], outliers: ["700156"] },
  { city: "Ahmedabad", hub: "380001", near: ["380001", "380015", "380054"], outliers: ["382481"] },
  { city: "Lucknow",   hub: "226001", near: ["226001", "226010", "226016"], outliers: ["226401"] },
  { city: "Kochi",     hub: "682001", near: ["682001", "682016", "682020"], outliers: ["682501"] },
  { city: "Indore",    hub: "452001", near: ["452001", "452010", "452016"], outliers: ["453441"] },
  { city: "Agra",      hub: "282001", near: ["282001", "282002", "282005"], outliers: ["283101"] },
  { city: "Chandigarh",hub: "160001", near: ["160001", "160017", "160022"], outliers: ["160101"] },
  { city: "Gurugram",  hub: "122001", near: ["122001", "122009", "122018"], outliers: ["122505"] },
  { city: "Varanasi",  hub: "221001", near: ["221001", "221005", "221010"], outliers: ["221104"] },
];

// PINs are stored/compared as strings so leading zeros survive.
function normalizePincode(pin) {
  if (pin === undefined || pin === null) return "";
  return String(pin).trim();
}

// Symmetric nearby map derived from the clusters above.
// { "600100": ["600100","600096","600073"], "600096": [...], ... }
const NEARBY_PINCODES = (() => {
  const map = {};
  for (const { near } of PIN_CLUSTERS) {
    for (const pin of near) {
      // union of the whole catchment, self first, de-duplicated
      map[pin] = Array.from(new Set([pin, ...near]));
    }
  }
  return map;
})();

// city name → hub PIN, used when seeding seller warehouse PINs.
const CITY_HUBS = PIN_CLUSTERS.reduce((acc, { city, hub }) => {
  acc[city] = hub;
  return acc;
}, {});

// Full catchment (near list) for a city — used as a seller's serviceable set.
const CITY_SERVICE_AREAS = PIN_CLUSTERS.reduce((acc, { city, near }) => {
  acc[city] = [...near];
  return acc;
}, {});

// Returns the PINs considered near `pin`. A PIN we have no mapping for is
// near only itself — never guessed from arithmetic distance.
function getNearbyPincodes(pin) {
  const key = normalizePincode(pin);
  if (!key) return [];
  return NEARBY_PINCODES[key] || [key];
}

module.exports = {
  PIN_CLUSTERS,
  NEARBY_PINCODES,
  CITY_HUBS,
  CITY_SERVICE_AREAS,
  normalizePincode,
  getNearbyPincodes,
};
