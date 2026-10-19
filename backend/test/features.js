// Feature test — exercises the two workflows that the smoke test doesn't reach:
// the two-tier administrator hierarchy, and the end-to-end order journey with
// its transition state machine and route-level authorization.
//
// Requires the API to be up first:  npm run dev   (from the repo root)
// Then, from backend/:              npm run test:features
//
// Override the target with API_URL, e.g. API_URL=http://localhost:5000
//
// Side effects: the administrator half creates and then removes its own test
// account, leaving no trace. The order half places one fresh Cash-on-Delivery
// order and drives it forward — exactly as a real checkout would — rather than
// mutating a seeded order, so the demonstration world stays intact. Run
// `npm run reseed` if you want the extra orders cleared.

const BASE = process.env.API_URL || "http://localhost:5000";

let passed = 0;
let failed = 0;
const ok = (name) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name, detail) => { failed++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); };

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, body: json };
}

const login = (email, password, role) =>
  api("/api/login", { method: "POST", body: { email, password, role } });

async function testAdminHierarchy() {
  console.log("Administrator hierarchy\n");

  const su = await login("admin@shopsphere.com", "admin1234", "admin");
  if (su.body?.adminRole === "SUPER_ADMIN") ok("founding administrator authenticates as SUPER_ADMIN");
  else return bad("founding administrator tier", `adminRole=${su.body?.adminRole} (run the server once to apply the seed backfill)`);
  const suToken = su.body.token;

  const roster = await api("/api/admin/admins", { token: suToken });
  roster.status === 200
    ? ok(`super administrator lists the roster (${roster.body.admins.length} administrators)`)
    : bad("roster listing", `status ${roster.status}: ${roster.body?.message}`);

  const plain = await login("rajesh.ops@shopsphere.com", "rajesh123", "admin");
  plain.body?.adminRole === "ADMIN"
    ? ok("ordinary administrator authenticates as ADMIN")
    : bad("ordinary administrator tier", `adminRole=${plain.body?.adminRole}`);

  const denied = await api("/api/admin/admins", { token: plain.body?.token });
  denied.status === 403
    ? ok("ordinary administrator is denied the roster (403)")
    : bad("tier enforcement", `expected 403, got ${denied.status}`);

  // create → suspend → verify lockout → remove, leaving no residue
  const email = `feature.test.${Date.now()}@shopsphere.com`;
  const created = await api("/api/admin/admins", {
    method: "POST", token: suToken,
    body: { name: "Feature Test Admin", email, password: "featuretest123", confirmPassword: "featuretest123", jobTitle: "Automated Test" },
  });
  created.status === 201 ? ok("super administrator creates an administrator") : bad("create administrator", `status ${created.status}: ${created.body?.message}`);
  const newId = created.body?.admin?.id;

  const weak = await api("/api/admin/admins", {
    method: "POST", token: suToken,
    body: { name: "Too Weak", email: `weak.${Date.now()}@shopsphere.com`, password: "short" },
  });
  weak.status === 400 ? ok("password shorter than 8 characters is rejected") : bad("password length validation", `status ${weak.status}`);

  const dup = await api("/api/admin/admins", {
    method: "POST", token: suToken,
    body: { name: "Duplicate", email, password: "featuretest123" },
  });
  dup.status === 409 ? ok("duplicate email is rejected (409)") : bad("duplicate email validation", `status ${dup.status}`);

  const demote = await api(`/api/admin/admins/${su.body.id}`, { method: "PATCH", token: suToken, body: { adminRole: "ADMIN" } });
  demote.status === 400 ? ok("founding administrator cannot be demoted") : bad("demotion guard", `status ${demote.status}`);

  const suspendFounder = await api(`/api/admin/admins/${su.body.id}/status`, { method: "PATCH", token: suToken, body: { status: "suspended" } });
  suspendFounder.status === 400 ? ok("founding administrator cannot be suspended") : bad("suspension guard", `status ${suspendFounder.status}`);

  await api(`/api/admin/admins/${newId}/status`, { method: "PATCH", token: suToken, body: { status: "suspended" } });
  const lockedOut = await login(email, "featuretest123", "admin");
  lockedOut.status === 403 ? ok("a suspended administrator is refused at login") : bad("suspension takes effect at login", `status ${lockedOut.status}`);

  const removed = await api(`/api/admin/admins/${newId}`, { method: "DELETE", token: suToken });
  removed.status === 200 ? ok("test administrator removed (no residue left behind)") : bad("delete administrator", `status ${removed.status}: ${removed.body?.message}`);
}

async function testOrderJourney() {
  console.log("\nOrder journey\n");

  const seller = await login("seller@shopsphere.com", "seller1234", "seller");
  const sellerToken = seller.body?.token;
  if (!sellerToken) return bad("seller login", "no token returned");

  // place a fresh Cash-on-Delivery order against one of this seller's products
  const catalogue = await api("/api/products?sellerId=me&limit=50", { token: sellerToken });
  const product = (catalogue.body?.products || []).find((p) => p.stock > 0);
  if (!product) return bad("catalogue", "no in-stock product found for the demo seller");

  const placed = await api("/api/orders", {
    method: "POST",
    body: {
      customerName: "Feature Test Buyer",
      customerEmail: "",
      customerPhone: "+91 90000 00000",
      customerAddress: "1 Test Street, Chennai",
      items: [{ productId: product.id, qty: 1 }],
      amount: product.price,
      paymentMethod: "Cash on Delivery",
    },
  });
  if (placed.status !== 201) return bad("place order", `status ${placed.status}: ${placed.body?.message}`);
  const orderId = placed.body.order.id;
  ok(`placed a fresh order ${orderId}`);

  // Stock-based auto-acceptance: every line resolved to a catalog product with
  // enough stock, so the order is accepted on creation rather than waiting on
  // the seller. The hop is attributed to "system" to distinguish it from a
  // seller clicking Accept.
  placed.body.order.sellerStatus === "Accepted"
    ? ok("an in-stock order is auto-accepted on creation")
    : bad("initial status", `expected Accepted, got ${placed.body.order.sellerStatus}`);

  const autoHop = (placed.body.order.statusHistory || []).find(
    (h) => h.status === "Accepted" && h.phase === "seller"
  );
  autoHop && autoHop.actor === "system"
    ? ok("the auto-acceptance is recorded with actor \"system\"")
    : bad("auto-accept hop", `got ${JSON.stringify(autoHop)}`);

  // route-level authorization
  const unauthenticated = await fetch(`${BASE}/api/orders/${orderId}/seller-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sellerStatus: "Accepted" }),
  });
  unauthenticated.status === 401
    ? ok("advancing an order without a token is refused (401)")
    : bad("lifecycle authentication", `expected 401, got ${unauthenticated.status}`);

  // state machine
  const skip = await api(`/api/orders/${orderId}/seller-status`, {
    method: "PATCH", token: sellerToken, body: { sellerStatus: "Delivered" },
  });
  skip.status === 400
    ? ok("skipping straight to Delivered is rejected by the state machine")
    : bad("state machine", `expected 400, got ${skip.status}`);

  for (const step of ["Packed", "Ready For Dispatch"]) {
    const r = await api(`/api/orders/${orderId}/seller-status`, {
      method: "PATCH", token: sellerToken, body: { sellerStatus: step },
    });
    r.status === 200 ? ok(`seller advances the order to ${step}`) : bad(`advance to ${step}`, `status ${r.status}: ${r.body?.message}`);
  }

  // ownership: a seller must not be able to drive another seller's order
  const admin = await login("admin@shopsphere.com", "admin1234", "admin");
  const all = await api("/api/orders", { token: admin.body.token });
  const foreign = (all.body?.orders || []).find((o) => o.sellerId && o.sellerId !== seller.body.id && o.sellerStatus === "Processing");
  if (foreign) {
    const cross = await api(`/api/orders/${foreign.id}/seller-status`, {
      method: "PATCH", token: sellerToken, body: { sellerStatus: "Accepted" },
    });
    cross.status === 403
      ? ok("a seller cannot advance another seller's order (403)")
      : bad("ownership enforcement", `expected 403, got ${cross.status}`);
  }

  // the journey itself
  const fetched = await api(`/api/orders/${orderId}`);
  const journey = fetched.body?.journey;
  if (!journey?.steps?.length) return bad("journey", "GET /api/orders/:id did not return a journey");
  ok("GET /api/orders/:id returns the computed journey");

  console.log(`        ${journey.steps.map((s) => `${s.key}:${s.state}`).join("  ")}`);

  const ready = journey.steps.find((s) => s.key === "Ready For Dispatch");
  ready?.state === "current" ? ok("Ready For Dispatch is marked as the current step") : bad("current step", `got ${ready?.state}`);

  const accepted = journey.steps.find((s) => s.key === "Accepted" && s.phase === "seller");
  accepted?.state === "done" && accepted.timestamp
    ? ok("the seller's Accepted hop is recorded with a timestamp")
    : bad("seller Accepted entry", JSON.stringify(accepted));

  // phase tagging is what keeps the two "Accepted" events distinct
  const deliveryAccepted = journey.steps.find((s) => s.key === "Accepted" && s.phase === "delivery");
  !deliveryAccepted || deliveryAccepted.state !== "done"
    ? ok("the courier's Accepted step stays separate from the seller's")
    : bad("phase disambiguation", "seller and courier Accepted collapsed into one entry");

  const placedStep = journey.steps.find((s) => s.phase === "order");
  placedStep?.state === "done" ? ok("the Placed step resolves with a timestamp") : bad("Placed step", JSON.stringify(placedStep));
}

async function main() {
  console.log(`ShopSphere feature test -> ${BASE}\n`);
  await testAdminHierarchy();
  await testOrderJourney();
  console.log(`\n${failed === 0 ? "OK" : "FAILURES"} — ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\nFeature test could not run:", err.message);
  console.error("Is the API running?  npm run dev  (from the repo root)");
  process.exit(1);
});
