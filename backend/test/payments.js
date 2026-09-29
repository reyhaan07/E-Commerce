// Payment integrity: the server prices the cart, and a verified payment can
// only buy the cart it actually paid for.
// Run with: npm run test:payments --prefix backend

const BASE = process.env.API_BASE || "http://localhost:5000/api";
let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${label}${detail ? `  ${detail}` : ""}`);
  condition ? (passed += 1) : (failed += 1);
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch (err) { /* empty */ }
  return { status: res.status, body: json };
}

const login = (email, password, role) => api("/login", { method: "POST", body: { email, password, role } });

(async () => {
  console.log(`\nShopSphere payment-integrity test -> ${BASE}\n`);

  const user = (await login("aditi@example.com", "aditi123", "user")).body;
  const seller = (await login("seller@shopsphere.com", "seller1234", "seller")).body;
  if (!user?.token) { console.error("Could not authenticate the demo customer."); process.exit(1); }

  const product = (await api("/products?sellerId=seller-1&limit=6", { token: seller.token }))
    .body.products.filter((p) => p.stock > 4)[0];

  // Online payment is off unless Razorpay keys (or ENABLE_MOCK_PAYMENTS=true)
  // are configured — the demo default is Cash on Delivery only.
  const cfg = (await api("/payments/config")).body;
  if (!cfg?.onlinePaymentEnabled) {
    console.log("Cash on Delivery only (Razorpay not configured)");
    check("payment config reports online payment disabled", cfg?.onlinePaymentEnabled === false);
    check("create-order refused", (await api("/payments/create-order", { method: "POST", token: user.token, body: { items: [{ productId: product.id, qty: 1 }] } })).status === 400);
    check("mock checkout refused", (await api("/payments/mock-pay", { method: "POST", token: user.token, body: { razorpayOrderId: "order_mock_x" } })).status === 400);
    const prepaid = await api("/orders", { method: "POST", token: user.token, body: {
      userId: user.id, customerName: "Payment Test", customerAddress: "1 Rd, Chennai 600100",
      customerPincode: "600100", paymentMethod: "Prepaid", amount: 1,
      items: [{ productId: product.id, qty: 1 }] } });
    check("a Prepaid order is refused", prepaid.status === 400, `(${prepaid.status})`);
    check("message points at Cash on Delivery", /cash on delivery/i.test(prepaid.body?.message || ""), `"${prepaid.body?.message}"`);
    const cod = await api("/orders", { method: "POST", token: user.token, body: {
      userId: user.id, customerName: "Payment Test", customerAddress: "1 Rd, Chennai 600100",
      customerPincode: "600100", paymentMethod: "Cash on Delivery", amount: 1,
      items: [{ productId: product.id, qty: 1 }] } });
    check("Cash on Delivery still works", cod.status === 201, `(${cod.status})`);
    if (cod.body?.order) console.log(`\ntest order created: ${cod.body.order.id}`);
    console.log(`\n${"=".repeat(56)}\n  ${passed} passed, ${failed} failed\n${"=".repeat(56)}`);
    console.log("\nRun with ENABLE_MOCK_PAYMENTS=true (and restart the server) to exercise the prepaid paths.");
    process.exit(failed ? 1 : 0);
  }
  const expectedTotal = product.price + 200; // one unit + flat delivery fee

  const created = [];
  const placeOrder = (body) => api("/orders", { method: "POST", token: user.token, body });
  const baseOrder = (extra) => ({
    userId: user.id,
    customerName: "Payment Test",
    customerEmail: "pay-test@example.com",
    customerAddress: "1 Test Road, Chennai, Tamil Nadu 600100",
    customerPincode: "600100",
    items: [{ productId: product.id, qty: 1 }],
    ...extra,
  });

  // ── the server prices the cart ──────────────────────────────────────────
  console.log("Server-side pricing");
  {
    const bad = await api("/payments/create-order", { method: "POST", token: user.token, body: { amount: 1 } });
    check("create-order no longer accepts a bare amount", bad.status === 400, `(${bad.status})`);

    const good = await api("/payments/create-order", { method: "POST", token: user.token, body: { items: [{ productId: product.id, qty: 1 }] } });
    check("create-order prices the cart itself", good.status === 201, `(${good.status})`);
    check("priced at the catalog total", good.body?.pricing?.total === expectedTotal, `(₹${good.body?.pricing?.total} vs ₹${expectedTotal})`);
    check("amount sent to Razorpay is in paise", good.body?.paymentOrder?.amount === Math.round(expectedTotal * 100), `(${good.body?.paymentOrder?.amount})`);
    check("no secret leaks to the browser", !JSON.stringify(good.body).toLowerCase().includes("secret"));

    const unknown = await api("/payments/create-order", { method: "POST", token: user.token, body: { items: [{ productId: "prod-does-not-exist", qty: 1 }] } });
    check("unknown product rejected", unknown.status === 400, `(${unknown.status})`);

    const anon = await api("/payments/create-order", { method: "POST", body: { items: [{ productId: product.id, qty: 1 }] } });
    check("unauthenticated rejected", anon.status === 401, `(${anon.status})`);
  }

  // helper: a genuinely paid intent for one unit
  async function payFor(items) {
    const co = await api("/payments/create-order", { method: "POST", token: user.token, body: { items } });
    const pay = await api("/payments/mock-pay", { method: "POST", token: user.token, body: { razorpayOrderId: co.body.paymentOrder.id } });
    return { intent: co.body, payment: pay.body };
  }

  // ── a correct prepaid order ─────────────────────────────────────────────
  console.log("\nHonest prepaid order");
  {
    const { payment } = await payFor([{ productId: product.id, qty: 1 }]);
    const res = await placeOrder(baseOrder({
      paymentMethod: "Prepaid", amount: expectedTotal,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
    }));
    check("order created", res.status === 201, `(${res.status})`);
    if (res.body?.order) created.push(res.body.order.id);
    check("stored at the server total", res.body?.order?.amount === expectedTotal, `(₹${res.body?.order?.amount})`);
    check("paymentStatus is Paid", res.body?.order?.paymentStatus === "Paid", `(${res.body?.order?.paymentStatus})`);
    check("signature retained for audit", Boolean(res.body?.order?.razorpaySignature));
  }

  // ── THE HOLE: pay for one cheap unit, try to buy many ───────────────────
  console.log("\nUnderpayment (the hole this work closes)");
  {
    const { payment } = await payFor([{ productId: product.id, qty: 1 }]);
    const res = await placeOrder(baseOrder({
      paymentMethod: "Prepaid", amount: expectedTotal,
      items: [{ productId: product.id, qty: 4 }], // paid for 1, ordering 4
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
    }));
    check("paying for 1 cannot buy 4", res.status === 400, `(${res.status})`);
    check("refusal names the mismatch", /doesn't match this order/i.test(res.body?.message || ""), `"${res.body?.message}"`);
    if (res.body?.order) created.push(res.body.order.id);
  }

  // ── replay: one payment, two orders ─────────────────────────────────────
  console.log("\nReplay");
  {
    const { payment } = await payFor([{ productId: product.id, qty: 1 }]);
    const body = baseOrder({
      paymentMethod: "Prepaid", amount: expectedTotal,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: payment.razorpaySignature,
    });
    const first = await placeOrder(body);
    check("first use succeeds", first.status === 201, `(${first.status})`);
    if (first.body?.order) created.push(first.body.order.id);
    const second = await placeOrder(body);
    check("the same payment can't buy a second order", second.status === 400, `(${second.status})`);
    check("refusal says already used", /already been used/i.test(second.body?.message || ""), `"${second.body?.message}"`);
    if (second.body?.order) created.push(second.body.order.id);
  }

  // ── forged signature ────────────────────────────────────────────────────
  console.log("\nForged signature");
  {
    const { payment } = await payFor([{ productId: product.id, qty: 1 }]);
    const res = await placeOrder(baseOrder({
      paymentMethod: "Prepaid", amount: expectedTotal,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpaySignature: "deadbeef".repeat(8),
    }));
    check("tampered signature refused", res.status === 400, `(${res.status})`);
    check("refusal mentions verification", /verif/i.test(res.body?.message || ""), `"${res.body?.message}"`);
    if (res.body?.order) created.push(res.body.order.id);

    const none = await placeOrder(baseOrder({ paymentMethod: "Prepaid", amount: expectedTotal }));
    check("prepaid with no payment at all refused", none.status === 400, `(${none.status})`);
    if (none.body?.order) created.push(none.body.order.id);
  }

  // ── COD is untouched ────────────────────────────────────────────────────
  console.log("\nCash on Delivery");
  {
    const res = await placeOrder(baseOrder({ paymentMethod: "Cash on Delivery", amount: 1 }));
    check("COD needs no payment", res.status === 201, `(${res.status})`);
    if (res.body?.order) created.push(res.body.order.id);
    check("COD priced by the server too", res.body?.order?.amount === expectedTotal, `(₹${res.body?.order?.amount})`);
    check("COD paymentStatus is Pending", res.body?.order?.paymentStatus === "Pending", `(${res.body?.order?.paymentStatus})`);
    check("no razorpay fields on a COD order", !res.body?.order?.razorpayOrderId);
  }

  console.log(`\n${"=".repeat(56)}\n  ${passed} passed, ${failed} failed\n${"=".repeat(56)}`);
  console.log(`\ntest orders created: ${created.join(", ") || "none"}`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("TEST DRIVER ERROR:", err.message);
  process.exit(1);
});
