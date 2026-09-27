// Per-item order cancellation (item-level cancel route).
// Run with: npm run test:cancellation --prefix backend
// Assumes the dev server is up on :5000 with the seeded demo database.

const BASE = process.env.API_BASE || "http://localhost:5000/api";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  PASS  ${label}${detail ? `  ${detail}` : ""}`);
    passed += 1;
  } else {
    console.log(`  FAIL  ${label}${detail ? `  ${detail}` : ""}`);
    failed += 1;
  }
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch (err) { /* empty body */ }
  return { status: res.status, body: json };
}

const login = (email, password, role) =>
  api("/login", { method: "POST", body: { email, password, role } });

// Places an order straight against the API so each test owns its own data.
async function placeOrder(token, userId, items, paymentMethod = "Cash on Delivery") {
  const res = await api("/orders", {
    method: "POST",
    token,
    body: {
      userId,
      customerName: "Cancellation Test",
      customerEmail: "cancel-test@example.com",
      customerAddress: "1 Test Road, Chennai, Tamil Nadu 600100",
      customerPincode: "600100",
      paymentMethod,
      amount: 1,
      items,
    },
  });
  return res.body?.order;
}

const stockOf = async (productId) =>
  (await api(`/products/${productId}`)).body?.product?.stock;

const getOrder = async (id, token) => (await api(`/orders/${id}`, { token })).body?.order;

const cancelItem = (orderId, itemId, token, body) =>
  api(`/orders/${orderId}/items/${itemId}/cancel`, { method: "POST", token, body });

// Moves an order along the seller chain so the later gates can be tested.
async function advance(orderId, sellerToken, statuses) {
  for (const sellerStatus of statuses) {
    await api(`/orders/${orderId}/seller-status`, { method: "PATCH", token: sellerToken, body: { sellerStatus } });
  }
}

(async () => {
  console.log(`\nShopSphere item-cancellation test -> ${BASE}\n`);

  const customer = (await login("aditi@example.com", "aditi123", "user")).body;
  const other = (await login("rahul@example.com", "rahul123", "user")).body;
  const seller = (await login("seller@shopsphere.com", "seller1234", "seller")).body;
  if (!customer?.token || !seller?.token) {
    console.error("Could not authenticate the demo accounts — is the server seeded?");
    process.exit(1);
  }

  // Two in-stock products belonging to the demo seller.
  const catalog = (await api("/products?sellerId=seller-1&limit=6", { token: seller.token })).body.products
    .filter((p) => p.stock > 5);
  const [productA, productB] = catalog;
  if (!productA || !productB) {
    console.error("Need two in-stock seller-1 products to run these tests.");
    process.exit(1);
  }

  const created = [];

  // ── 1. cancel before packing ────────────────────────────────────────────
  console.log("Cancelling before the seller packs");
  {
    const before = await stockOf(productA.id);
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 2 }]);
    created.push(order.id);
    check("order auto-accepts on creation", order.sellerStatus === "Accepted", `(${order.sellerStatus})`);
    check("each line carries an itemId", Boolean(order.items[0].itemId), `(${order.items[0].itemId})`);

    const res = await cancelItem(order.id, order.items[0].itemId, customer.token, { reason: "Ordered by mistake" });
    check("cancel while Accepted succeeds", res.status === 200, `(${res.status})`);
    check("line marked cancelled", res.body?.item?.cancelled === true);
    check("reason stored", res.body?.item?.cancellationReason === "Ordered by mistake");
    check("cancelledAt stamped", Boolean(res.body?.item?.cancelledAt));
    check("stock restored exactly", (await stockOf(productA.id)) === before, `(${before})`);

    // ── 7. duplicate cancellation ─────────────────────────────────────────
    const dup = await cancelItem(order.id, order.items[0].itemId, customer.token, { reason: "No longer needed" });
    check("duplicate cancellation refused", dup.status === 400, `(${dup.status})`);
    check("duplicate says already cancelled", /already been cancelled/i.test(dup.body?.message || ""));
    check("stock not restored twice", (await stockOf(productA.id)) === before);

    // ── 13. every line cancelled closes the order ─────────────────────────
    const closed = await getOrder(order.id, customer.token);
    check("order closes when the last line goes", closed.sellerStatus === "Cancelled", `(${closed.sellerStatus})`);
  }

  // ── 5 & 6. multi-item: cancel one line only ─────────────────────────────
  console.log("\nMulti-item order");
  {
    const beforeA = await stockOf(productA.id);
    const beforeB = await stockOf(productB.id);
    const order = await placeOrder(customer.token, customer.id, [
      { productId: productA.id, qty: 1 },
      { productId: productB.id, qty: 2 },
    ]);
    created.push(order.id);
    const lineB = order.items.find((i) => i.productId === productB.id);

    const res = await cancelItem(order.id, lineB.itemId, customer.token, { reason: "Wrong product ordered" });
    check("one line cancels", res.status === 200, `(${res.status})`);

    const after = await getOrder(order.id, customer.token);
    const a = after.items.find((i) => i.productId === productA.id);
    const b = after.items.find((i) => i.productId === productB.id);
    check("the other line is untouched", a.cancelled !== true);
    check("the cancelled line is marked", b.cancelled === true);
    check("order stays live", after.sellerStatus !== "Cancelled", `(${after.sellerStatus})`);
    check("only the cancelled line restocked", (await stockOf(productB.id)) === beforeB);
    check("untouched line stays sold", (await stockOf(productA.id)) === beforeA - 1);
  }

  // ── the window closes at courier pickup, not at packing ─────────────────
  console.log("\nStill cancellable while the parcel is with the seller");
  {
    // Packed
    let order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    await advance(order.id, seller.token, ["Packed"]);
    let res = await cancelItem(order.id, order.items[0].itemId, customer.token, { reason: "No longer needed" });
    check("STILL cancellable once Packed", res.status === 200, `(${res.status})`);

    // Ready For Dispatch
    order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    await advance(order.id, seller.token, ["Packed", "Ready For Dispatch"]);
    res = await cancelItem(order.id, order.items[0].itemId, customer.token, { reason: "No longer needed" });
    check("STILL cancellable once Ready For Dispatch", res.status === 200, `(${res.status})`);
  }

  console.log("\nBlocked once the courier has the parcel");
  {
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    const itemId = order.items[0].itemId;

    await advance(order.id, seller.token, ["Packed", "Ready For Dispatch", "Shipped"]);
    const shipped = await cancelItem(order.id, itemId, customer.token, { reason: "No longer needed" });
    check("refused once Shipped/dispatched", shipped.status === 400, `(${shipped.status})`);
    check("dispatch message is specific", /dispatched/i.test(shipped.body?.message || ""), `"${shipped.body?.message}"`);

    await advance(order.id, seller.token, ["Delivered"]);
    const delivered = await cancelItem(order.id, itemId, customer.token, { reason: "No longer needed" });
    check("refused once Delivered", delivered.status === 400, `(${delivered.status})`);
    check("delivered points at returns", /return/i.test(delivered.body?.message || ""), `"${delivered.body?.message}"`);
  }

  // ── 8. ownership + auth ─────────────────────────────────────────────────
  console.log("\nOwnership");
  {
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    const itemId = order.items[0].itemId;

    const anon = await cancelItem(order.id, itemId, null, { reason: "Ordered by mistake" });
    check("no token rejected", anon.status === 401, `(${anon.status})`);

    if (other?.token) {
      const stranger = await cancelItem(order.id, itemId, other.token, { reason: "Ordered by mistake" });
      check("another customer rejected", stranger.status === 403, `(${stranger.status})`);
      check("ownership message", /owner of this order/i.test(stranger.body?.message || ""));
    } else {
      console.log("  SKIP  another customer rejected (second demo customer unavailable)");
    }

    const missing = await cancelItem(order.id, `${order.id}-99`, customer.token, { reason: "Ordered by mistake" });
    check("unknown item id is 404", missing.status === 404, `(${missing.status})`);
  }

  // ── reason validation ───────────────────────────────────────────────────
  console.log("\nReason validation");
  {
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    const itemId = order.items[0].itemId;

    const bad = await cancelItem(order.id, itemId, customer.token, { reason: "Because I said so" });
    check("reason off the list rejected", bad.status === 400, `(${bad.status})`);

    const otherNoNote = await cancelItem(order.id, itemId, customer.token, { reason: "Other" });
    check("Other without a note rejected", otherNoNote.status === 400, `(${otherNoNote.status})`);

    const otherWithNote = await cancelItem(order.id, itemId, customer.token, { reason: "Other", note: "Duplicate order placed by accident" });
    check("Other with a note accepted", otherWithNote.status === 200, `(${otherWithNote.status})`);
    check("note stored", otherWithNote.body?.item?.cancellationNote === "Duplicate order placed by accident");
  }

  // ── 10. COD: no refund claimed ──────────────────────────────────────────
  console.log("\nCash on Delivery");
  {
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }], "Cash on Delivery");
    created.push(order.id);
    const res = await cancelItem(order.id, order.items[0].itemId, customer.token, { reason: "No longer needed" });
    check("COD line cancels", res.status === 200, `(${res.status})`);
    check("no refund amount on COD", (res.body?.item?.refundAmount || 0) === 0);
    check("refund status left empty on COD", !res.body?.item?.refundStatus, `(${res.body?.item?.refundStatus})`);
  }

  // ── 12. race: seller packs between the check and the confirm ────────────
  console.log("\nRace condition");
  {
    const before = await stockOf(productA.id);
    const order = await placeOrder(customer.token, customer.id, [{ productId: productA.id, qty: 1 }]);
    created.push(order.id);
    const itemId = order.items[0].itemId;
    const afterPlacing = await stockOf(productA.id);

    // The customer opened the modal while it was still cancellable...
    const eligibleNow = canCancelLocally(await getOrder(order.id, customer.token), itemId);
    check("cancellable at the moment the modal opened", eligibleNow);

    // ...the parcel is handed to the courier before they press Confirm.
    await advance(order.id, seller.token, ["Packed", "Ready For Dispatch", "Shipped"]);

    const res = await cancelItem(order.id, itemId, customer.token, { reason: "Ordered by mistake" });
    check("the late confirm is refused", res.status === 400, `(${res.status})`);
    check("refusal names dispatch", /dispatched/i.test(res.body?.message || ""), `"${res.body?.message}"`);
    check("stock NOT restored on a refused cancel", (await stockOf(productA.id)) === afterPlacing, `(${afterPlacing})`);
    check("stock still reflects the sale", afterPlacing === before - 1);
  }

  console.log(`\n${"=".repeat(56)}\n  ${passed} passed, ${failed} failed\n${"=".repeat(56)}`);
  console.log(`\ntest orders created: ${created.join(", ")}`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("TEST DRIVER ERROR:", err.message);
  process.exit(1);
});

// Mirrors the server's eligibility rule closely enough for the race setup.
function canCancelLocally(order, itemId) {
  if (!order) return false;
  const item = (order.items || []).find((i) => i.itemId === itemId);
  if (!item || item.cancelled) return false;
  if (![null, undefined, "Assigned", "Accepted"].includes(order.deliveryStatus)) return false;
  return ["Processing", "Accepted", "Packed", "Ready For Dispatch"].includes(order.sellerStatus);
}
