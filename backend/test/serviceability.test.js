// Unit test for the PIN-code serviceability + partner-eligibility logic.
// Pure functions only — no database, no running server required:
//   node test/serviceability.test.js
//
// Mirrors the edge cases in the Part B specification.

const assert = require("assert");
const {
  checkServiceability,
  eligiblePartners,
  isPartnerEligible,
  areaLabel,
  isValidPincode,
} = require("../utils/serviceability");
const { getNearbyPincodes, NEARBY_PINCODES } = require("../data/pincodes");

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name} — ${err.message}`);
  }
}

// A Chennai seller matching the spec example.
const seller = {
  warehousePincode: "600100",
  serviceablePincodes: ["600100", "600096", "600073"],
};

// Partner roster covering same-area / nearby / far / offline / on-delivery.
const partners = [
  { id: "p-arun",    name: "Arun",    status: "Active",      pincode: "600100" }, // same area, eligible
  { id: "p-rahul",   name: "Rahul",   status: "Active",      pincode: "600096" }, // nearby, eligible
  { id: "p-karthik", name: "Karthik", status: "Active",      pincode: "600073" }, // nearby, eligible
  { id: "p-vijay",   name: "Vijay",   status: "Active",      pincode: "600042" }, // same city, NOT nearby → excluded
  { id: "p-offline", name: "Suresh",  status: "Offline",     pincode: "600096" }, // nearby PIN but inactive → excluded
  { id: "p-busy",    name: "Ganesh",  status: "On Delivery", pincode: "600100" }, // nearby PIN but not available → excluded
  { id: "p-other",   name: "Ravi",    status: "Active",      pincode: "400001" }, // different city → excluded
];

console.log("PIN serviceability\n");

// ── Nearby mapping is explicit + symmetric, never arithmetic ──────────────
test("nearby mapping is symmetric within a cluster", () => {
  assert.deepStrictEqual(getNearbyPincodes("600100").sort(), ["600073", "600096", "600100"]);
  assert.deepStrictEqual(getNearbyPincodes("600096").sort(), ["600073", "600096", "600100"]);
  assert.deepStrictEqual(getNearbyPincodes("600073").sort(), ["600073", "600096", "600100"]);
});

test("numerically-adjacent PINs are NOT treated as nearby", () => {
  // 600100 and 600042 are numerically close but not in the same catchment.
  assert.ok(!getNearbyPincodes("600100").includes("600042"));
  // 600101 doesn't exist in any cluster → near only itself.
  assert.deepStrictEqual(getNearbyPincodes("600101"), ["600101"]);
});

test("an unmapped PIN is near only itself", () => {
  assert.deepStrictEqual(getNearbyPincodes("999999"), ["999999"]);
});

// ── Serviceability edge cases ─────────────────────────────────────────────
test("edge 1: seller PIN === customer PIN → serviceable", () => {
  assert.strictEqual(checkServiceability(seller, "600100").serviceable, true);
});

test("edge 2: customer PIN in service area → serviceable", () => {
  assert.strictEqual(checkServiceability(seller, "600096").serviceable, true);
});

test("edge 3: customer PIN NOT in service area → unavailable", () => {
  const res = checkServiceability(seller, "600042");
  assert.strictEqual(res.serviceable, false);
  assert.strictEqual(res.reason, "out-of-service-area");
});

test("edge 7: missing customer PIN → graceful failure, not a crash", () => {
  assert.strictEqual(checkServiceability(seller, "").serviceable, false);
  assert.strictEqual(checkServiceability(seller, null).serviceable, false);
  assert.strictEqual(checkServiceability(seller, undefined).reason, "missing-customer-pincode");
});

test("invalid (non 6-digit) customer PIN → rejected", () => {
  assert.strictEqual(checkServiceability(seller, "12ab").serviceable, false);
  assert.strictEqual(checkServiceability(seller, "12345").reason, "invalid-customer-pincode");
});

test("leading zeros preserved (string comparison, not numeric)", () => {
  const zeroSeller = { warehousePincode: "045678", serviceablePincodes: ["045678"] };
  assert.strictEqual(checkServiceability(zeroSeller, "045678").serviceable, true);
  assert.strictEqual(checkServiceability(zeroSeller, "45678").serviceable, false); // 5 digits ≠ 6
  assert.ok(isValidPincode("045678"));
});

test("customer PIN is trimmed before comparison", () => {
  assert.strictEqual(checkServiceability(seller, "  600096  ").serviceable, true);
});

// ── Partner eligibility edge cases ────────────────────────────────────────
test("area label: same PIN → 'Same area', different → 'Nearby area'", () => {
  assert.strictEqual(areaLabel("600100", "600100"), "Same area");
  assert.strictEqual(areaLabel("600100", "600096"), "Nearby area");
});

test("only active + available + nearby partners are eligible", () => {
  const eligible = eligiblePartners(partners, seller.warehousePincode);
  // same-area first (Arun), then nearby sorted alphabetically (Karthik, Rahul)
  assert.deepStrictEqual(eligible.map((p) => p.id), ["p-arun", "p-karthik", "p-rahul"]);
  assert.ok(eligible.every((p) => ["Same area", "Nearby area"].includes(p.area)));
});

test("same-area partner sorts before nearby partners", () => {
  const eligible = eligiblePartners(partners, seller.warehousePincode);
  assert.strictEqual(eligible[0].id, "p-arun");
  assert.strictEqual(eligible[0].area, "Same area");
  assert.ok(eligible.slice(1).every((p) => p.area === "Nearby area"));
});

test("edge 5: an unavailable (On Delivery) nearby partner is hidden", () => {
  assert.strictEqual(isPartnerEligible({ status: "On Delivery", pincode: "600100" }, "600100"), false);
});

test("edge 6: an inactive (Offline) nearby partner is hidden", () => {
  assert.strictEqual(isPartnerEligible({ status: "Offline", pincode: "600096" }, "600100"), false);
});

test("edge 4: seller serviceable but no nearby partner → empty list", () => {
  const farOnly = [{ id: "x", name: "Far", status: "Active", pincode: "400001" }];
  assert.deepStrictEqual(eligiblePartners(farOnly, "600100"), []);
});

test("a same-city-but-not-nearby partner (600042) is excluded", () => {
  assert.strictEqual(isPartnerEligible({ status: "Active", pincode: "600042" }, "600100"), false);
});

console.log(`\n${failed === 0 ? "OK" : "FAILURES"} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
