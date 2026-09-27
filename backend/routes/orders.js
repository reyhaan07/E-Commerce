const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { Order, SELLER_STATUSES, SELLER_TRANSITIONS, DELIVERY_STATUSES, PAYMENT_METHODS, buildJourney } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { Product } = require("../models/product.model");
const { getAuthFromHeader, requireAuth, requireRole, requireActiveAccount, requireActivePartner } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { nextId } = require("../utils/sequence");
const { priceOrder } = require("../utils/pricing");
const { PaymentIntent } = require("../models/paymentIntent.model");
const {
  CANCELLABLE_SELLER_STATUSES, PRE_PICKUP_DELIVERY_STATUSES, CANCEL_REASONS,
  canCancelItem, itemRefundAmount, allItemsCancelled,
} = require("../utils/cancellation");
const { emitToAll, emitToRole, emitToUser } = require("../realtime");
const { notifyRole, notifyUser } = require("../utils/notify");
const { sendMail, templates } = require("../utils/mailer");
const razorpay = require("../utils/razorpay");
const {
  checkServiceability, eligiblePartners, isPartnerEligible,
  areaLabel, isValidPincode,
} = require("../utils/serviceability");
const { normalizePincode } = require("../data/pincodes");

// The customer PIN drives serviceability. Newer orders carry it explicitly;
// for legacy orders fall back to the last 6-digit run in the address string.
function resolveCustomerPincode(order) {
  const explicit = normalizePincode(order.customerPincode);
  if (isValidPincode(explicit)) return explicit;
  const matches = String(order.customerAddress || "").match(/\b(\d{6})\b/g);
  return matches ? matches[matches.length - 1] : "";
}

// 1 loyalty point per 100 rupees spent, same as a lot of real stores do it
const LOYALTY_POINTS_PER_RUPEE = 1 / 100;

// Atomic counter (utils/sequence) rather than a max+1 scan: two simultaneous
// checkouts used to read the same maximum and one died on the unique index.
async function nextOrderId() {
  return nextId("order", Order, "ORD-", 1000);
}

// Undo the reservations an order holds: put the stock back on sale. Refunds are
// not part of the product right now (the store takes Cash on Delivery only), so
// cancelling releases inventory and nothing else.
async function releaseOrder(order) {
  for (const item of order.items) {
    if (item.productId) {
      await Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty } });
    }
  }
}

function newTrackingId() {
  return `TRK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

// Every lifecycle hop goes through here, so the timeline stays complete no
// matter which console drove the change.
function recordHop(order, { status, phase, actor, note }) {
  order.statusHistory.push({
    status,
    phase,
    actor,
    note: note || "",
    timestamp: new Date(),
  });
}

// The courier's identity is admin-only information. A seller sees that a
// delivery has been assigned, but never who is carrying it — so this strips the
// partner fields from anything served to a seller. Customers keep them: the
// person waiting at home legitimately needs their courier's name and number.
function redactPartnerForSeller(order, auth) {
  const json = typeof order.toJSON === "function" ? order.toJSON() : { ...order };
  if (auth && auth.role === "seller") {
    delete json.deliveryPartnerId;
    delete json.deliveryPartnerName;
    delete json.deliveryPartnerPhone;
  }
  return json;
}

// A seller may only touch their own orders; an admin may touch any.
function sellerOwnsOrder(auth, order) {
  return auth.role === "admin" || order.sellerId === auth.id;
}

// GET /api/orders?deliveryPartnerId=&sellerStatus=&deliveryStatus=&userId=&sellerId=&pickupRequested=&history=true
router.get("/", asyncHandler(async (req, res) => {
  const { deliveryPartnerId, sellerStatus, deliveryStatus, userId, sellerId, pickupRequested, history } = req.query;

  // Delivery History (Feature 4): terminal-state jobs for one partner —
  // delivered, cancelled or returned work, newest first. The demo partner
  // ("delivery-demo") sees every partner's terminal jobs, mirroring how the
  // console already lets it see all live orders.
  if (history === "true") {
    const terminal = {
      $or: [
        { deliveryStatus: "Delivered" },
        { "cancellation.status": "Approved" },
        { sellerStatus: { $in: ["Cancelled", "Returned"] } },
      ],
    };
    const filter =
      deliveryPartnerId && deliveryPartnerId !== "delivery-demo"
        ? { deliveryPartnerId, ...terminal }
        : terminal;
    const jobs = await Order.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, orders: jobs });
  }

  // filtering by deliveryPartnerId/sellerStatus/deliveryStatus is used by the
  // admin/seller/delivery apps and stays open like before - but asking for a
  // specific user's orders needs to be that user (or an admin)
  if (userId) {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }
    if (auth.role !== "admin" && auth.id !== userId) {
      return res.status(403).json({ success: false, message: "You don't have access to this user's orders" });
    }
  }

  const filter = {};
  if (deliveryPartnerId) filter.deliveryPartnerId = deliveryPartnerId;
  if (sellerStatus) filter.sellerStatus = sellerStatus;
  if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
  if (userId) filter.userId = userId;
  if (sellerId) filter.sellerId = sellerId; // seller console shows only its own orders
  if (pickupRequested !== undefined) filter.pickupRequested = pickupRequested === "true";

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  const auth = getAuthFromHeader(req);
  res.json({ success: true, orders: orders.map((o) => redactPartnerForSeller(o, auth)) });
}));

// GET /api/orders/:id
// `journey` is the end-to-end timeline (seller phase + delivery phase) that
// both the storefront and the seller console render, so neither has to
// reimplement what the steps are or which one is current.
router.get("/:id", asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  const auth = getAuthFromHeader(req);
  res.json({ success: true, order: redactPartnerForSeller(order, auth), journey: buildJourney(order) });
}));

// POST /api/orders — checkout (Feature 7 steps 4-7).
// Prepaid orders must carry a verified Razorpay (test) payment; COD skips the
// gateway. Stock is decremented per item, the admin + seller are notified in
// real time, and the customer gets a confirmation email.
router.post("/", asyncHandler(async (req, res) => {
  const {
    userId, customerName, customerEmail, customerPhone, customerAddress, customerPincode,
    items, amount, paymentMethod, sellerName, sellerAddress, sellerPhone,
    razorpayOrderId, razorpayPaymentId, razorpaySignature,
  } = req.body;

  if (!customerName || !amount) {
    return res.status(400).json({ success: false, message: "customerName and amount are required" });
  }
  if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: "Invalid paymentMethod" });
  }
  if (userId) {
    const auth = getAuthFromHeader(req);
    if (!auth) {
      return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    }
    if (auth.role !== "admin" && auth.id !== userId) {
      return res.status(403).json({ success: false, message: "You can't place an order for another user" });
    }
    // A suspended customer keeps a valid JWT until it expires, so re-read the
    // status here rather than trusting the token. Checked inline instead of via
    // requireActiveAccount because guest checkout (no userId) stays unauthenticated.
    const buyer = await Account.findOne({ id: userId }, "status");
    if (buyer && buyer.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is suspended and can't place orders. Contact a platform administrator.",
      });
    }
  }

  // Prepaid orders must present a payment signature we can verify (step 4)
  const method = paymentMethod || "Prepaid";
  // Card / UPI / net banking all run through Razorpay. With no credentials
  // configured there is no honest way to take that money, so the only method
  // on offer is Cash on Delivery — enforced here, not just hidden in the UI.
  if (method === "Prepaid" && !razorpay.onlinePaymentEnabled) {
    return res.status(400).json({
      success: false,
      message: "Online payment isn't available yet. Please choose Cash on Delivery.",
    });
  }
  if (method === "Prepaid") {
    const verified = razorpay.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!verified) {
      return res.status(400).json({ success: false, message: "Payment could not be verified" });
    }
  }

  // resolve catalog products so we can snapshot prices, decrement stock and
  // attribute the order to the right seller
  const orderItems = [];
  let sellerId = null;
  // Auto-acceptance requires that every line was confirmed against the catalog.
  // Free-text lines (no productId — the seed data has some) carry no stock we
  // can verify, so they hold the order at "Processing" for the seller to review
  // by hand rather than being assumed available.
  let allItemsStockBacked = true;
  // Stock already taken on this request, so a later line failing can put it
  // back instead of stranding it (the old code left earlier items decremented).
  const claimed = [];
  const releaseClaimed = async () => {
    for (const c of claimed) {
      await Product.updateOne({ id: c.productId }, { $inc: { stock: c.qty } });
    }
  };

  for (const item of items || []) {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    if (item.productId) {
      const product = await Product.findOne({ id: String(item.productId), isArchived: { $ne: true } });
      if (!product) {
        await releaseClaimed();
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }
      // Out-of-stock is rejected here, at creation — an order for unavailable
      // stock is never persisted, so there is no "awaiting stock" state further
      // down the lifecycle to look for.
      //
      // The check and the decrement are one atomic update: read-then-save let
      // two simultaneous checkouts both pass the check, which lost decrements
      // and drifted the stock count away from what had actually been sold.
      const taken = await Product.findOneAndUpdate(
        { id: product.id, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!taken) {
        await releaseClaimed();
        const left = await Product.findOne({ id: product.id }, "stock").lean();
        return res.status(400).json({ success: false, message: `Only ${left ? left.stock : 0} left of ${product.name}` });
      }
      claimed.push({ productId: product.id, qty }); // step 5: stock decremented
      sellerId = sellerId || product.sellerId;
      orderItems.push({ productId: product.id, name: product.name, qty, price: product.price, image: (product.images || [])[0] || "" });
    } else {
      allItemsStockBacked = false;
      orderItems.push({ name: item.name, qty, price: Number(item.price) || 0 });
    }
  }
  // An order with no items at all has nothing to confirm available.
  if (orderItems.length === 0) allItemsStockBacked = false;

  // Order total, priced by the server. The client used to send `amount` and it
  // was stored as-is, so a crafted request could buy a full cart for ₹1. Prices
  // come from the catalog snapshot above; the shipping rule mirrors the
  // checkout screen so the figure the customer agreed to is unchanged.
  // Free-text lines carry no verifiable price, so those orders keep the
  // client's amount rather than being silently repriced to something lower.
  const pricing = priceOrder(orderItems);
  const clientAmount = Number(amount);
  const authoritativeAmount = allItemsStockBacked ? pricing.total : clientAmount;

  // A valid signature proves the payment belongs to a Razorpay order — not that
  // the right amount was paid. Match it against the intent the server priced,
  // and spend the intent so the same payment can't buy a second cart.
  if (method === "Prepaid" && allItemsStockBacked) {
    const intent = await PaymentIntent.findOne({ razorpayOrderId });
    if (!intent) {
      await releaseClaimed();
      return res.status(400).json({ success: false, message: "This payment doesn't match an order we created." });
    }
    if (intent.consumed) {
      await releaseClaimed();
      return res.status(400).json({ success: false, message: "This payment has already been used for another order." });
    }
    if (userId && intent.userId !== userId) {
      await releaseClaimed();
      return res.status(403).json({ success: false, message: "This payment belongs to a different account." });
    }
    if (Math.abs(intent.amount - pricing.total) > 0.01) {
      await releaseClaimed();
      return res.status(400).json({
        success: false,
        message: `The amount paid (₹${intent.amount}) doesn't match this order (₹${pricing.total}).`,
      });
    }
    // Spend it atomically — two simultaneous submissions can't both win.
    const spent = await PaymentIntent.findOneAndUpdate(
      { razorpayOrderId, consumed: false },
      { $set: { consumed: true } },
      { new: true }
    );
    if (!spent) {
      await releaseClaimed();
      return res.status(400).json({ success: false, message: "This payment has already been used for another order." });
    }
  }

  const seller = sellerId ? await Account.findOne({ id: sellerId, role: "seller" }) : null;
  const sellerCity = seller && (seller.addresses.find((a) => a.isDefault) || seller.addresses[0]);

  // Capture the customer delivery PIN (Part B). Prefer an explicit value, then
  // the placing user's default address, then the last 6-digit run in the free-
  // text address. Stored trimmed as a string so leading zeros survive.
  let resolvedPincode = normalizePincode(customerPincode);
  if (!isValidPincode(resolvedPincode) && userId) {
    const buyer = await Account.findOne({ id: userId });
    const addr = buyer && (buyer.addresses.find((a) => a.isDefault) || buyer.addresses[0]);
    if (addr?.pincode) resolvedPincode = normalizePincode(addr.pincode);
  }
  if (!isValidPincode(resolvedPincode)) {
    const m = String(customerAddress || "").match(/\b(\d{6})\b/g);
    resolvedPincode = m ? m[m.length - 1] : "";
  }

  const orderId = await nextOrderId();
  // Stable per-line handle so item-level routes have something to address —
  // the item subdocument carries no _id of its own.
  orderItems.forEach((item, i) => { item.itemId = `${orderId}-${i + 1}`; });

  const order = await Order.create({
    id: orderId,
    userId: userId || null,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    customerPincode: resolvedPincode,
    items: orderItems,
    amount: authoritativeAmount,
    pricing: allItemsStockBacked ? pricing : undefined,
    paymentMethod: method,
    razorpayOrderId: method === "Prepaid" ? razorpayOrderId : null,
    razorpayPaymentId: method === "Prepaid" ? razorpayPaymentId : null,
    razorpaySignature: method === "Prepaid" ? razorpaySignature : null,
    paymentStatus: method === "Prepaid" ? "Paid" : "Pending",
    sellerId,
    sellerName: seller ? seller.name : sellerName,
    sellerAddress: sellerCity ? `${sellerCity.line1}, ${sellerCity.city}` : sellerAddress,
    sellerPhone: seller ? seller.phone : sellerPhone,
    // first entry on the timeline — everything after it is a state change
    statusHistory: [{ status: "Placed", phase: "order", actor: "user", note: "", timestamp: new Date() }],
  });

  // Stock-based auto-acceptance. Every line was resolved against the catalog
  // and had enough stock (creation would have 400'd otherwise), so there is
  // nothing for the seller to decide — the order moves straight to "Accepted".
  // The hop goes through SELLER_TRANSITIONS like any manual change, and is
  // recorded with actor "system" so the timeline distinguishes an automatic
  // acceptance from a seller clicking Accept.
  const autoAccepted = allItemsStockBacked && (SELLER_TRANSITIONS[order.sellerStatus] || []).includes("Accepted");
  if (autoAccepted) {
    order.sellerStatus = "Accepted";
    recordHop(order, {
      status: "Accepted",
      phase: "seller",
      actor: "system",
      note: "Auto-accepted — all items in stock",
    });
    await order.save();
  }

  // give the account some loyalty points and empty out their cart now that
  // the order has gone through
  if (userId) {
    const account = await Account.findOne({ id: userId, role: "user" });
    if (account) {
      account.loyaltyPoints += Math.round(amount * LOYALTY_POINTS_PER_RUPEE);
      account.cart = [];
      await account.save();
    }
  }

  // steps 6-7: real-time notifications for admin + seller dashboards
  emitToAll("order-created", { orderId: order.id, amount: order.amount, sellerStatus: order.sellerStatus });
  await notifyRole("admin", "new-order", `New order ${order.id}`, `${customerName} — ₹${amount}`, { orderId: order.id });
  // The seller who owns the order is notified directly; only orders we couldn't
  // attribute to a seller fall back to the role-wide broadcast.
  const sellerNote = autoAccepted
    ? `${customerName} — ₹${amount} · auto-accepted, all items in stock`
    : `${customerName} — ₹${amount}`;
  if (order.sellerId) {
    await notifyUser(order.sellerId, "new-order", `New order ${order.id}`, sellerNote, { orderId: order.id, sellerStatus: order.sellerStatus });
  } else {
    await notifyRole("seller", "new-order", `New order ${order.id}`, sellerNote, { orderId: order.id });
  }
  if (customerEmail) {
    await sendMail({ to: customerEmail, ...templates.orderConfirmed(customerName, order) });
  }

  res.status(201).json({ success: true, order });
}));

// PATCH /api/orders/:id/seller-status  { sellerStatus, note? }
// The seller's half of the journey: Processing → Accepted → Packed → Ready For
// Dispatch. Transitions are validated against SELLER_TRANSITIONS so an order
// can't skip steps, and every hop is written to the shared timeline.
router.patch("/:id/seller-status", requireAuth, requireActiveAccount, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const { sellerStatus, note } = req.body;
  if (!SELLER_STATUSES.includes(sellerStatus)) {
    return res.status(400).json({ success: false, message: "Invalid sellerStatus" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }

  const current = order.sellerStatus;
  if (sellerStatus === current) {
    return res.json({ success: true, order, journey: buildJourney(order) });
  }

  const allowed = SELLER_TRANSITIONS[current] || [];
  if (!allowed.includes(sellerStatus)) {
    return res.status(400).json({
      success: false,
      message: allowed.length
        ? `An order that is "${current}" can only move to: ${allowed.join(", ")}`
        : `An order that is "${current}" is final and cannot change`,
    });
  }

  // Cancelling or rejecting from the seller console ends the order, so the
  // stock it is holding goes back on sale and a prepaid customer is refunded —
  // previously neither happened on this path and the customer just saw the
  // order flip to "Cancelled" with no money back and no reason.
  if (sellerStatus === "Cancelled" || sellerStatus === "Rejected") {
    order.cancellation = {
      ...(order.cancellation ? order.cancellation.toObject?.() || order.cancellation : {}),
      requested: true,
      status: "Approved",
      reason: order.cancellation?.reason || note || `${sellerStatus} by seller`,
      resolutionNote: note || "",
      resolvedAt: new Date(),
    };
    await releaseOrder(order);
  }

  order.sellerStatus = sellerStatus;
  recordHop(order, { status: sellerStatus, phase: "seller", actor: req.auth.role, note });
  await order.save();

  emitToAll("order-updated", { orderId: order.id, sellerStatus });
  if (order.userId) {
    await notifyUser(order.userId, "order-status", `Order ${order.id}: ${sellerStatus}`, note || "", { orderId: order.id, sellerStatus });
  }
  res.json({ success: true, order, journey: buildJourney(order) });
}));

// PATCH /api/orders/:id/request-pickup — seller flags the packed order for
// delivery-partner assignment (Feature 7 step 9)
router.patch("/:id/request-pickup", requireAuth, requireActiveAccount, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }
  if (order.sellerStatus !== "Ready For Dispatch") {
    return res.status(400).json({ success: false, message: "Order must be Ready For Dispatch before requesting pickup" });
  }

  order.pickupRequested = true;
  await order.save();

  emitToRole("admin", "pickup-requested", { orderId: order.id });
  await notifyRole("admin", "pickup-requested", `Pickup requested for ${order.id}`, order.sellerName || "", { orderId: order.id });
  res.json({ success: true, order });
}));

// Human-readable copy for a failed serviceability check.
const SERVICEABILITY_MESSAGE = {
  "missing-customer-pincode": "This order has no delivery PIN code on file, so serviceability can't be checked.",
  "invalid-customer-pincode": "The customer's delivery PIN code is invalid.",
  "seller-has-no-service-area": "This store hasn't set up any serviceable PIN codes yet.",
  "out-of-service-area": "Delivery is currently unavailable for this location.",
};

// Shared context for both the eligible-partners view and assignment validation.
async function assignmentContext(order) {
  const seller = order.sellerId ? await Account.findOne({ id: order.sellerId, role: "seller" }) : null;
  const customerPincode = resolveCustomerPincode(order);
  const serviceability = checkServiceability(seller || { serviceablePincodes: [] }, customerPincode);
  const warehousePincode = normalizePincode(seller?.warehousePincode);
  return { seller, customerPincode, warehousePincode, serviceability };
}

// GET /api/orders/:id/eligible-partners
// Part B: the ONLY partner list the assignment UI should ever see. Filtering is
// done here on the backend — never trust the client to hide ineligible
// partners. Returns serviceability first, then (if serviceable) the active +
// available + PIN-eligible partners, each tagged Same area / Nearby area.
router.get("/:id/eligible-partners", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }

  const { seller, customerPincode, warehousePincode, serviceability } = await assignmentContext(order);

  if (!serviceability.serviceable) {
    return res.json({
      success: true,
      serviceable: false,
      reason: serviceability.reason,
      message: SERVICEABILITY_MESSAGE[serviceability.reason] || "Delivery is currently unavailable for this location.",
      customerPincode,
      warehousePincode,
      partners: [],
    });
  }

  const all = await DeliveryPartner.find().lean();
  const partners = eligiblePartners(all, warehousePincode).map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    vehicle: p.vehicle,
    zone: p.zone,
    pincode: p.pincode,
    status: p.status,
    area: p.area,
  }));

  res.json({
    success: true,
    serviceable: true,
    customerPincode,
    warehousePincode,
    sellerName: seller?.name || order.sellerName,
    partners,
    message: partners.length
      ? undefined
      : "No delivery partners are currently available near this seller.",
  });
}));

// PATCH /api/orders/:id/assign  { deliveryPartnerId }
// Seller or admin assigns/reassigns a partner. The assignment is fully
// REVALIDATED here (Part B security requirement) — the order must be
// serviceable to the customer's PIN AND the partner must be active, available
// and PIN-eligible. Generates the tracking id on first assignment and emails
// it to the customer (Feature 7 steps 10-12).
router.patch("/:id/assign", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { deliveryPartnerId } = req.body;
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }

  // Assignment only becomes possible once the seller has finished preparing
  // the parcel and marked it ready for pickup. Until then the order isn't in
  // the admin's queue at all, so a direct API call must be refused.
  if (order.sellerStatus !== "Ready For Dispatch") {
    return res.status(400).json({
      success: false,
      message: `This order is "${order.sellerStatus}". A delivery partner can only be assigned once the seller has marked it ready for pickup.`,
    });
  }

  const partner = await DeliveryPartner.findOne({ id: deliveryPartnerId });
  if (!partner) {
    return res.status(400).json({ success: false, message: "Delivery partner not found" });
  }

  // Revalidate serviceability + partner eligibility on the server — the client
  // filtering is a convenience only and must never be trusted.
  const { warehousePincode, serviceability } = await assignmentContext(order);
  if (!serviceability.serviceable) {
    return res.status(400).json({
      success: false,
      reason: serviceability.reason,
      message: SERVICEABILITY_MESSAGE[serviceability.reason] || "Delivery is currently unavailable for this location.",
    });
  }
  if (!isPartnerEligible(partner, warehousePincode)) {
    return res.status(400).json({
      success: false,
      message: "Cannot assign this delivery partner. The partner is outside the eligible delivery area, or is not currently available.",
    });
  }

  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.deliveryStatus = "Assigned";
  order.pickupRequested = true;
  if (!order.trackingId) order.trackingId = newTrackingId(); // step 11
  recordHop(order, {
    status: "Assigned", phase: "delivery", actor: req.auth.role,
    note: `Assigned to ${partner.name} (${areaLabel(warehousePincode, partner.pincode)})`,
  });
  await order.save();

  emitToAll("order-updated", { orderId: order.id, deliveryStatus: "Assigned", trackingId: order.trackingId });
  emitToRole("delivery", "delivery-assigned", { orderId: order.id, partnerId: partner.id });
  // Persisted, partner-targeted copy of the assignment. The delivery console
  // connects with userId = the partner's id, so it is already in the
  // `user:{id}` room; the role emit above stays so open consoles still reload.
  await notifyUser(
    partner.id,
    "delivery-assigned",
    `New delivery assigned: ${order.id}`,
    `${order.customerName} — ${areaLabel(warehousePincode, partner.pincode)}`,
    { orderId: order.id, trackingId: order.trackingId, partnerId: partner.id }
  );
  if (order.userId) {
    await notifyUser(order.userId, "delivery-assigned", `Order ${order.id} is with ${partner.name}`, `Tracking id ${order.trackingId}`, { orderId: order.id, trackingId: order.trackingId });
  }
  if (order.customerEmail) {
    await sendMail({ to: order.customerEmail, ...templates.trackingAssigned(order.customerName, order) });
  }

  res.json({ success: true, order });
}));

// PATCH /api/orders/:id/delivery-status  { deliveryStatus }
// Driven by the delivery console; broadcasts each hop so seller/admin/user
// views update live (Feature 8).
router.patch("/:id/delivery-status", requireAuth, requireActivePartner, requireRole("delivery", "admin"), asyncHandler(async (req, res) => {
  const { deliveryStatus, note } = req.body;
  if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
    return res.status(400).json({ success: false, message: "Invalid deliveryStatus" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  // a partner may only advance a job that's actually theirs
  if (req.auth.role === "delivery" && order.deliveryPartnerId !== req.auth.id) {
    return res.status(403).json({ success: false, message: "This delivery is assigned to another partner" });
  }

  order.deliveryStatus = deliveryStatus;
  if (deliveryStatus === "Picked Up" && order.sellerStatus === "Ready For Dispatch") {
    order.sellerStatus = "Shipped";
    recordHop(order, { status: "Shipped", phase: "seller", actor: "system", note: "Handed to the courier" });
  }
  recordHop(order, { status: deliveryStatus, phase: "delivery", actor: req.auth.role, note });
  await order.save();

  emitToAll("order-updated", { orderId: order.id, deliveryStatus, sellerStatus: order.sellerStatus });
  if (order.userId) {
    await notifyUser(order.userId, "order-status", `Order ${order.id}: ${deliveryStatus}`, "", { orderId: order.id, deliveryStatus });
  }
  if (order.customerEmail && (deliveryStatus === "Out For Delivery" || deliveryStatus === "Delivered")) {
    await sendMail({ to: order.customerEmail, ...templates.statusUpdate(order.customerName, order, deliveryStatus) });
  }

  res.json({ success: true, order });
}));

// PATCH /api/orders/:id/confirm-delivery — seller confirms the partner's
// delivery (Feature 7 step 14a)
router.patch("/:id/confirm-delivery", requireAuth, requireActiveAccount, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }
  if (order.deliveryStatus !== "Delivered") {
    return res.status(400).json({ success: false, message: "The delivery partner hasn't marked this order delivered yet" });
  }

  order.sellerConfirmedDelivery = true;
  if (order.sellerStatus !== "Delivered") {
    order.sellerStatus = "Delivered";
    recordHop(order, { status: "Delivered", phase: "seller", actor: req.auth.role, note: "Seller confirmed delivery" });
  }
  await order.save();

  emitToAll("order-updated", { orderId: order.id, sellerStatus: "Delivered" });
  res.json({ success: true, order });
}));

// PATCH /api/orders/:id/complete — admin closes out the order (step 14b)
router.patch("/:id/complete", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.sellerStatus !== "Delivered") {
    return res.status(400).json({ success: false, message: "Only delivered orders can be completed" });
  }

  order.completed = true;
  await order.save();

  emitToAll("order-updated", { orderId: order.id, completed: true });
  res.json({ success: true, order });
}));

// POST /api/orders/:id/cancel  { reason } — user requests cancellation while
// the order hasn't shipped (Feature 10). Suspended accounts can't raise one;
// an admin can still cancel on their behalf.
router.post("/:id/cancel", requireAuth, requireActiveAccount, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (req.auth.role !== "admin" && order.userId !== req.auth.id) {
    return res.status(403).json({ success: false, message: "This order belongs to another user" });
  }
  // An in-stock order is auto-accepted on creation, so "Accepted" is where a
  // normal order sits moments after checkout. It used to be missing from this
  // list, which told a customer their brand-new order had "already shipped".
  if (!CANCELLABLE_SELLER_STATUSES.includes(order.sellerStatus)) {
    return res.status(400).json({ success: false, message: "This order can no longer be cancelled — you can request a return after delivery" });
  }
  if (order.cancellation.requested && order.cancellation.status === "Requested") {
    return res.status(400).json({ success: false, message: "A cancellation request is already pending" });
  }

  const { reason } = req.body;
  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ success: false, message: "reason is required" });
  }

  order.cancellation = { requested: true, reason: reason.trim(), status: "Requested", requestedAt: new Date() };
  await order.save();

  emitToAll("cancellation-updated", { orderId: order.id, status: "Requested" });
  await notifyRole("admin", "cancellation-requested", `Cancellation requested for ${order.id}`, reason.trim(), { orderId: order.id });
  await notifyRole("seller", "cancellation-requested", `Cancellation requested for ${order.id}`, reason.trim(), { orderId: order.id });

  res.json({ success: true, order });
}));

// PATCH /api/orders/:id/cancellation  { decision: "Approved"|"Rejected", note }
// Admin or seller resolves the request. Approval refunds prepaid payments via
// the Razorpay test refund API, restocks items and cancels the order.
// Guarded: this route issues refunds, and it previously had no auth at all —
// anyone who knew an order id could approve a cancellation and trigger one.
router.patch("/:id/cancellation", requireAuth, requireActiveAccount, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  if (decision !== "Approved" && decision !== "Rejected") {
    return res.status(400).json({ success: false, message: "decision must be Approved or Rejected" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!sellerOwnsOrder(req.auth, order)) {
    return res.status(403).json({ success: false, message: "This order belongs to another seller" });
  }
  if (!order.cancellation.requested || order.cancellation.status !== "Requested") {
    return res.status(400).json({ success: false, message: "No pending cancellation request on this order" });
  }

  order.cancellation.status = decision;
  order.cancellation.resolvedAt = new Date();
  order.cancellation.resolutionNote = note;

  if (decision === "Approved") {
    // Anything before the courier takes custody can still be pulled back.
    if (!["Processing", "Accepted", "Packed", "Ready For Dispatch"].includes(order.sellerStatus)) {
      return res.status(400).json({ success: false, message: "This order has already shipped" });
    }

    await releaseOrder(order);
    order.sellerStatus = "Cancelled";
    recordHop(order, { status: "Cancelled", phase: "seller", actor: "admin", note: note || order.cancellation.reason || "" });
  }
  await order.save();

  emitToAll("cancellation-updated", { orderId: order.id, status: decision });
  if (order.userId) {
    await notifyUser(order.userId, "cancellation-updated", `Cancellation ${decision.toLowerCase()} for ${order.id}`, note || "", { orderId: order.id, status: decision });
  }
  if (order.customerEmail) {
    if (decision === "Rejected") {
      await sendMail({ to: order.customerEmail, ...templates.cancellationRejected(order.customerName, order.id, note) });
    }
  }

  res.json({ success: true, order });
}));

// POST /api/orders/:id/items/:itemId/cancel  { reason, note? }
// Cancels ONE line of an order. Immediate rather than request-based: before the
// seller has packed anything a cancellation costs them nothing, so making the
// customer wait for approval only adds a queue. The order-level request flow
// above is untouched and still handles whole-order cancellations.
router.post("/:id/items/:itemId/cancel", requireAuth, asyncHandler(async (req, res) => {
  const { reason, note } = req.body;
  if (typeof reason !== "string" || !CANCEL_REASONS.includes(reason)) {
    return res.status(400).json({ success: false, message: `reason must be one of: ${CANCEL_REASONS.join(", ")}` });
  }
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (reason === "Other" && !trimmedNote) {
    return res.status(400).json({ success: false, message: "Tell us a little about why you're cancelling." });
  }
  if (trimmedNote.length > 500) {
    return res.status(400).json({ success: false, message: "The note must be under 500 characters" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (req.auth.role !== "admin" && order.userId !== req.auth.id) {
    return res.status(403).json({ success: false, message: "Only the owner of this order can cancel this item." });
  }

  const item = (order.items || []).find((i) => i.itemId === req.params.itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: "This item isn't part of this order." });
  }

  const eligibility = canCancelItem(order, item);
  if (!eligibility.allowed) {
    return res.status(400).json({ success: false, reason: eligibility.reason, message: eligibility.message });
  }

  const now = new Date();

  // The whole eligibility check is re-applied inside the filter, so a seller
  // packing the order between the check above and this write makes the update
  // match nothing rather than cancelling a packed item. Nothing below runs
  // unless this update actually claimed the line, which is what keeps the
  // restock exactly-once under a repeated or racing request.
  const claimed = await Order.findOneAndUpdate(
    {
      id: order.id,
      sellerStatus: { $in: CANCELLABLE_SELLER_STATUSES },
      deliveryStatus: { $in: PRE_PICKUP_DELIVERY_STATUSES },
      items: { $elemMatch: { itemId: item.itemId, cancelled: { $ne: true } } },
    },
    {
      $set: {
        "items.$[line].cancelled": true,
        "items.$[line].cancelledAt": now,
        "items.$[line].cancelledBy": req.auth.id,
        "items.$[line].cancellationReason": reason,
        "items.$[line].cancellationNote": trimmedNote,
      },
    },
    {
      new: true,
      arrayFilters: [{ "line.itemId": item.itemId, "line.cancelled": { $ne: true } }],
    }
  );

  if (!claimed) {
    // Lost the race (or a duplicate request) — re-read and say precisely why.
    const fresh = await Order.findOne({ id: order.id });
    const freshItem = fresh && (fresh.items || []).find((i) => i.itemId === req.params.itemId);
    const why = canCancelItem(fresh, freshItem);
    return res.status(400).json({
      success: false,
      reason: why.reason || "not-cancellable",
      message: why.message || "Unable to cancel this item. Please try again.",
    });
  }

  // Put the stock back — only now that the line is provably ours.
  if (item.productId) {
    await Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty } });
  }

  // Re-read so the response, the timeline and the "everything cancelled" check
  // all see the same document.
  let updated = await Order.findOne({ id: order.id });

  // When the last live line goes, close the order itself through the status
  // the seller flow already uses. Nothing else about the lifecycle changes.
  if (allItemsCancelled(updated)) {
    updated.sellerStatus = "Cancelled";
    updated.cancellation = {
      ...(updated.cancellation?.toObject?.() || updated.cancellation || {}),
      requested: true,
      status: "Approved",
      reason: updated.cancellation?.reason || "All items cancelled by the customer",
      resolvedAt: now,
    };
    recordHop(updated, { status: "Cancelled", phase: "seller", actor: "user", note: "All items cancelled by the customer" });
    await updated.save();
  }

  emitToAll("cancellation-updated", { orderId: updated.id, itemId: item.itemId, status: "Item Cancelled" });
  if (updated.sellerId) {
    await notifyUser(updated.sellerId, "cancellation-updated", `Item cancelled on ${updated.id}`,
      `${item.name} × ${item.qty} — ${reason}`, { orderId: updated.id, itemId: item.itemId });
  }
  await notifyRole("admin", "cancellation-updated", `Item cancelled on ${updated.id}`,
    `${item.name} × ${item.qty} — ${reason}`, { orderId: updated.id, itemId: item.itemId });

  const cancelledItem = (updated.items || []).find((i) => i.itemId === item.itemId);
  res.json({ success: true, order: updated, item: cancelledItem, journey: buildJourney(updated) });
}));

module.exports = router;
