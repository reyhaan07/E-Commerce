const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { Order, SELLER_STATUSES, SELLER_TRANSITIONS, DELIVERY_STATUSES, PAYMENT_METHODS, buildJourney } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { Product } = require("../models/product.model");
const { getAuthFromHeader, requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { emitToAll, emitToRole, emitToUser } = require("../realtime");
const { notifyRole, notifyUser } = require("../utils/notify");
const { sendMail, templates } = require("../utils/mailer");
const razorpay = require("../utils/razorpay");

// 1 loyalty point per 100 rupees spent, same as a lot of real stores do it
const LOYALTY_POINTS_PER_RUPEE = 1 / 100;

async function nextOrderId() {
  const orders = await Order.find({}, "id").lean();
  const maxNum = orders.reduce((max, o) => {
    const num = parseInt(String(o.id).replace("ORD-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 1000);
  return `ORD-${maxNum + 1}`;
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
  res.json({ success: true, orders });
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
  res.json({ success: true, order, journey: buildJourney(order) });
}));

// POST /api/orders — checkout (Feature 7 steps 4-7).
// Prepaid orders must carry a verified Razorpay (test) payment; COD skips the
// gateway. Stock is decremented per item, the admin + seller are notified in
// real time, and the customer gets a confirmation email.
router.post("/", asyncHandler(async (req, res) => {
  const {
    userId, customerName, customerEmail, customerPhone, customerAddress,
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
  }

  // Prepaid orders must present a payment signature we can verify (step 4)
  const method = paymentMethod || "Prepaid";
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
  for (const item of items || []) {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
    if (item.productId) {
      const product = await Product.findOne({ id: String(item.productId) });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }
      if (product.stock < qty) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} left of ${product.name}` });
      }
      product.stock -= qty; // step 5: stock decremented
      await product.save();
      sellerId = sellerId || product.sellerId;
      orderItems.push({ productId: product.id, name: product.name, qty, price: product.price });
    } else {
      orderItems.push({ name: item.name, qty, price: Number(item.price) || 0 });
    }
  }

  const seller = sellerId ? await Account.findOne({ id: sellerId, role: "seller" }) : null;
  const sellerCity = seller && (seller.addresses.find((a) => a.isDefault) || seller.addresses[0]);

  const order = await Order.create({
    id: await nextOrderId(),
    userId: userId || null,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    items: orderItems,
    amount,
    paymentMethod: method,
    razorpayOrderId: method === "Prepaid" ? razorpayOrderId : null,
    razorpayPaymentId: method === "Prepaid" ? razorpayPaymentId : null,
    sellerId,
    sellerName: seller ? seller.name : sellerName,
    sellerAddress: sellerCity ? `${sellerCity.line1}, ${sellerCity.city}` : sellerAddress,
    sellerPhone: seller ? seller.phone : sellerPhone,
    // first entry on the timeline — everything after it is a state change
    statusHistory: [{ status: "Placed", phase: "order", actor: "user", note: "", timestamp: new Date() }],
  });

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
  emitToAll("order-created", { orderId: order.id, amount: order.amount });
  await notifyRole("admin", "new-order", `New order ${order.id}`, `${customerName} — ₹${amount}`, { orderId: order.id });
  await notifyRole("seller", "new-order", `New order ${order.id}`, `${customerName} — ₹${amount}`, { orderId: order.id });
  if (customerEmail) {
    await sendMail({ to: customerEmail, ...templates.orderConfirmed(customerName, order) });
  }

  res.status(201).json({ success: true, order });
}));

// PATCH /api/orders/:id/seller-status  { sellerStatus, note? }
// The seller's half of the journey: Processing → Accepted → Packed → Ready For
// Dispatch. Transitions are validated against SELLER_TRANSITIONS so an order
// can't skip steps, and every hop is written to the shared timeline.
router.patch("/:id/seller-status", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
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
router.patch("/:id/request-pickup", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
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

// PATCH /api/orders/:id/assign  { deliveryPartnerId }
// Admin assigns/reassigns a partner; generates the tracking id on first
// assignment and emails it to the customer (Feature 7 steps 10-12).
router.patch("/:id/assign", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { deliveryPartnerId } = req.body;
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const partner = await DeliveryPartner.findOne({ id: deliveryPartnerId });
  if (!partner) {
    return res.status(400).json({ success: false, message: "Delivery partner not found" });
  }

  order.deliveryPartnerId = partner.id;
  order.deliveryPartnerName = partner.name;
  order.deliveryPartnerPhone = partner.phone;
  order.deliveryStatus = "Assigned";
  if (!order.trackingId) order.trackingId = newTrackingId(); // step 11
  recordHop(order, { status: "Assigned", phase: "delivery", actor: "admin", note: `Assigned to ${partner.name}` });
  await order.save();

  emitToAll("order-updated", { orderId: order.id, deliveryStatus: "Assigned", trackingId: order.trackingId });
  emitToRole("delivery", "delivery-assigned", { orderId: order.id, partnerId: partner.id });
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
router.patch("/:id/delivery-status", requireAuth, requireRole("delivery", "admin"), asyncHandler(async (req, res) => {
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
router.patch("/:id/confirm-delivery", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
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
// the order hasn't shipped (Feature 10)
router.post("/:id/cancel", requireAuth, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (req.auth.role !== "admin" && order.userId !== req.auth.id) {
    return res.status(403).json({ success: false, message: "This order belongs to another user" });
  }
  if (!["Processing", "Ready For Dispatch"].includes(order.sellerStatus)) {
    return res.status(400).json({ success: false, message: "This order has already shipped and can't be cancelled — you can request a return after delivery" });
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
router.patch("/:id/cancellation", asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  if (decision !== "Approved" && decision !== "Rejected") {
    return res.status(400).json({ success: false, message: "decision must be Approved or Rejected" });
  }

  const order = await Order.findOne({ id: req.params.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
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

    if (order.paymentMethod === "Prepaid") {
      const refund = await razorpay.refundPayment(order.razorpayPaymentId, order.amount);
      order.cancellation.refundId = refund.id;
      order.cancellation.refundAmount = order.amount;
    }
    order.sellerStatus = "Cancelled";
    recordHop(order, { status: "Cancelled", phase: "seller", actor: "admin", note: note || order.cancellation.reason || "" });
    for (const item of order.items) {
      if (item.productId) {
        await Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty } });
      }
    }
  }
  await order.save();

  emitToAll("cancellation-updated", { orderId: order.id, status: decision });
  if (order.userId) {
    await notifyUser(order.userId, "cancellation-updated", `Cancellation ${decision.toLowerCase()} for ${order.id}`, note || "", { orderId: order.id, status: decision });
  }
  if (order.customerEmail) {
    if (decision === "Approved" && order.paymentMethod === "Prepaid") {
      await sendMail({ to: order.customerEmail, ...templates.refundConfirmed(order.customerName, order.id, order.amount) });
    } else if (decision === "Rejected") {
      await sendMail({ to: order.customerEmail, ...templates.cancellationRejected(order.customerName, order.id, note) });
    }
  }

  res.json({ success: true, order });
}));

module.exports = router;
