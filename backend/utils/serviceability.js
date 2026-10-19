// ─────────────────────────────────────────────────────────────────────────
// Delivery serviceability + delivery-partner eligibility.
//
// Pure, database-free logic so it can be unit-tested in isolation and reused
// by any route. Two independent questions are answered here:
//
//   1. Can this seller deliver to this customer?
//      → the customer's PIN must be in the seller's serviceablePincodes list.
//
//   2. Which delivery partners are eligible to carry a given order?
//      → partner is Active AND Available AND their PIN is "near" the seller's
//        warehouse PIN (via the explicit nearby mapping, never PIN arithmetic).
//
// The API layer must treat this module as the source of truth and revalidate
// on every assignment — the frontend filtering is a convenience only.
// ─────────────────────────────────────────────────────────────────────────

const { normalizePincode } = require("../data/pincodes");
// Catchments are admin-editable and cached in memory by utils/coverage; it
// falls back to the static map in data/pincodes when nothing is loaded, so
// this module stays pure and unit-testable without a database.
const { getNearbyPincodes } = require("./coverage");

const PINCODE_RE = /^\d{6}$/;

function isValidPincode(pin) {
  return PINCODE_RE.test(normalizePincode(pin));
}

// Statuses that mean a partner is free to take a new job. The DeliveryPartner
// model already carries "Active" / "On Delivery" / "Offline" — we reuse it
// rather than inventing a second availability flag.
//   Active      → available
//   On Delivery → busy (still active, but not free for a new job)
//   Offline     → inactive
function isPartnerActive(partner) {
  return normalizeStatus(partner) !== "offline";
}

function isPartnerAvailable(partner) {
  return normalizeStatus(partner) === "active";
}

function normalizeStatus(partner) {
  return String(partner?.status || "").trim().toLowerCase();
}

// Seller → customer serviceability. Returns a structured result rather than a
// bare boolean so callers can surface the precise reason.
function checkServiceability(seller, customerPincode) {
  const customerPin = normalizePincode(customerPincode);
  const serviceable = (seller?.serviceablePincodes || []).map(normalizePincode).filter(Boolean);

  if (!customerPin) {
    return { serviceable: false, reason: "missing-customer-pincode", customerPincode: customerPin };
  }
  if (!isValidPincode(customerPin)) {
    return { serviceable: false, reason: "invalid-customer-pincode", customerPincode: customerPin };
  }
  if (serviceable.length === 0) {
    return { serviceable: false, reason: "seller-has-no-service-area", customerPincode: customerPin };
  }
  if (!serviceable.includes(customerPin)) {
    return { serviceable: false, reason: "out-of-service-area", customerPincode: customerPin };
  }
  return { serviceable: true, reason: "serviceable", customerPincode: customerPin };
}

// Label a partner's location relative to the seller's warehouse PIN. No
// distance is ever computed — only "same PIN" vs "different (but nearby) PIN".
function areaLabel(warehousePincode, partnerPincode) {
  const warehouse = normalizePincode(warehousePincode);
  const partner = normalizePincode(partnerPincode);
  if (warehouse && partner && warehouse === partner) return "Same area";
  return "Nearby area";
}

// A suspended / deactivated account can never take work, whatever its duty
// status says. accountStatus is absent on partners seeded before the field
// existed, which reads as active - the same default the schema applies.
function isPartnerAccountActive(partner) {
  return (partner?.accountStatus || "active") === "active";
}

// Is one partner eligible for a seller whose warehouse is `warehousePincode`?
// Eligible ⇔ account in good standing AND active AND available AND PIN ∈ nearby(warehouse).
function isPartnerEligible(partner, warehousePincode) {
  if (!isPartnerAccountActive(partner)) return false;
  if (!isPartnerActive(partner)) return false;
  if (!isPartnerAvailable(partner)) return false;
  const nearby = getNearbyPincodes(warehousePincode);
  return nearby.includes(normalizePincode(partner?.pincode));
}

// Filter + decorate a partner list for a seller. Returns partners that are
// active, available and PIN-eligible, each tagged with its area label.
// `partners` are plain objects with at least { id, name, status, pincode }.
function eligiblePartners(partners, warehousePincode) {
  const warehouse = normalizePincode(warehousePincode);
  return (partners || [])
    .filter((p) => isPartnerEligible(p, warehouse))
    .map((p) => ({
      ...p,
      area: areaLabel(warehouse, p.pincode),
    }))
    // Same-area partners first, then nearby, then alphabetical for stability.
    .sort((a, b) => {
      if (a.area !== b.area) return a.area === "Same area" ? -1 : 1;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
}

module.exports = {
  PINCODE_RE,
  isValidPincode,
  isPartnerActive,
  isPartnerAvailable,
  isPartnerAccountActive,
  checkServiceability,
  areaLabel,
  isPartnerEligible,
  eligiblePartners,
};
