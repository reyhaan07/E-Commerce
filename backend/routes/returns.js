// Feature 11 — Return / Refund. Status chain:
//   Requested → Admin Review → Seller Approved → Pickup Scheduled →
//   Picked Up → Under Inspection → Refund Approved → Refunded  (or Rejected)
// Each actor moves the request one step; every transition lands in
// statusHistory and pushes a Socket.io event + notification.

const express = require("express");
const router = express.Router();
const { ReturnRequest, RETURN_STATUSES } = require("../models/returnRequest.model");
const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyRole, notifyUser } = require("../utils/notify");
const { emitToAll } = require("../realtime");
const razorpay = require("../utils/razorpay");
const { sendMail, templates } = require("../utils/mailer");

// which role may move a return INTO a given status, and from where
const TRANSITIONS = {
  "Admin Review": { role: "admin", from: ["Requested"] },
  "Seller Approved": { role: "seller", from: ["Admin Review"] },
  "Pickup Scheduled": { role: "admin", from: ["Seller Approved"] }, // via /assign-pickup
  "Picked Up": { role: "delivery", from: ["Pickup Scheduled"] },
  "Under Inspection": { role: "delivery", from: ["Picked Up"] },
  "Refund Approved": { role: "admin", from: ["Under Inspection"] },
  "Refunded": { role: "admin", from: ["Refund Approved"] }, // via /refund
  "Rejected": { role: ["admin", "seller"], from: ["Requested", "Admin Review", "Seller Approved", "Under Inspection"] },
};

async function nextReturnId() {
  const returns = await ReturnRequest.find({}, "id").lean();
  const maxNum = returns.reduce((max, r) => {
    const num = parseInt(String(r.id).replace("RET-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 2000);
  return `RET-${maxNum + 1}`;
}

function pushStatus(ret, status, note) {
  ret.status = status;
  ret.statusHistory.push({ status, timestamp: new Date(), note });
}

async function broadcast(ret, message) {
  emitToAll("return-updated", { returnId: ret.id, orderId: ret.orderId, status: ret.status });
  await notifyUser(ret.userId, "return-updated", `Return ${ret.id}: ${ret.status}`, message || "", { returnId: ret.id, status: ret.status });
}

// POST /api/returns  { orderId, items, reason, photos }
router.post("/", requireAuth, requireRole("user"), asyncHandler(async (req, res) => {
  const { orderId, items, reason, photos } = req.body;
  if (typeof reason !== "string" || !reason.trim()) {
    return res.status(400).json({ success: false, message: "reason is required" });
  }
  if (photos !== undefined && (!Array.isArray(photos) || photos.length > 5)) {
    return res.status(400).json({ success: false, message: "photos must be an array of at most 5 images" });
  }

  const order = await Order.findOne({ id: orderId, userId: req.auth.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.sellerStatus !== "Delivered" && order.deliveryStatus !== "Delivered") {
    return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
  }
  if (await ReturnRequest.findOne({ orderId, status: { $nin: ["Rejected"] } })) {
    return res.status(400).json({ success: false, message: "A return is already open for this order" });
  }

  const returnItems = Array.isArray(items) && items.length
    ? items
    : order.items.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty }));

  const ret = await ReturnRequest.create({
    id: await nextReturnId(),
    orderId,
    userId: req.auth.id,
    customerName: order.customerName,
    items: returnItems,
    reason: reason.trim(),
    photos: photos || [],
    status: "Requested",
    statusHistory: [{ status: "Requested", timestamp: new Date() }],
  });

  await notifyRole("admin", "return-requested", `Return requested for ${orderId}`, reason.trim(), { returnId: ret.id, orderId });
  await notifyRole("seller", "return-requested", `Return requested for ${orderId}`, reason.trim(), { returnId: ret.id, orderId });
  emitToAll("return-updated", { returnId: ret.id, orderId, status: ret.status });

  res.status(201).json({ success: true, return: ret });
}));

// GET /api/returns?status=&pickupPartnerId=
// Admin/seller see everything; users see their own; delivery partners see
// pickups assigned to them.
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const filter = {};
  if (req.auth.role === "user") {
    filter.userId = req.auth.id;
  } else if (req.auth.role === "delivery") {
    filter.pickupPartnerId = req.auth.id;
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.pickupPartnerId && ["admin", "seller"].includes(req.auth.role)) {
    filter.pickupPartnerId = req.query.pickupPartnerId;
  }

  const returns = await ReturnRequest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, returns });
}));

// GET /api/returns/:id
router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findOne({ id: req.params.id });
  if (!ret) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  if (req.auth.role === "user" && ret.userId !== req.auth.id) {
    return res.status(403).json({ success: false, message: "This return belongs to another user" });
  }
  res.json({ success: true, return: ret });
}));

// PATCH /api/returns/:id/status  { status, note }
router.patch("/:id/status", requireAuth, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const rule = TRANSITIONS[status];
  if (!RETURN_STATUSES.includes(status) || !rule) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const allowedRoles = Array.isArray(rule.role) ? rule.role : [rule.role];
  if (!allowedRoles.includes(req.auth.role)) {
    return res.status(403).json({ success: false, message: `Only ${allowedRoles.join("/")} can set status "${status}"` });
  }

  const ret = await ReturnRequest.findOne({ id: req.params.id });
  if (!ret) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  if (!rule.from.includes(ret.status)) {
    return res.status(400).json({ success: false, message: `Can't move from "${ret.status}" to "${status}"` });
  }
  if (status === "Pickup Scheduled" || status === "Refunded") {
    return res.status(400).json({ success: false, message: `Use the dedicated endpoint for "${status}"` });
  }

  pushStatus(ret, status, note);
  await ret.save();
  await broadcast(ret, note);

  res.json({ success: true, return: ret });
}));

// PATCH /api/returns/:id/assign-pickup  { deliveryPartnerId } — admin, reverse route
router.patch("/:id/assign-pickup", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findOne({ id: req.params.id });
  if (!ret) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  if (ret.status !== "Seller Approved") {
    return res.status(400).json({ success: false, message: `Pickup can only be scheduled from "Seller Approved" (currently "${ret.status}")` });
  }

  const partner = await DeliveryPartner.findOne({ id: req.body.deliveryPartnerId });
  if (!partner) {
    return res.status(400).json({ success: false, message: "Delivery partner not found" });
  }

  ret.pickupPartnerId = partner.id;
  ret.pickupPartnerName = partner.name;
  pushStatus(ret, "Pickup Scheduled", `Pickup by ${partner.name}`);
  await ret.save();
  await broadcast(ret, `Pickup scheduled with ${partner.name}`);

  res.json({ success: true, return: ret });
}));

// PATCH /api/returns/:id/inspect  { result: "Pass"|"Fail", note } — seller
router.patch("/:id/inspect", requireAuth, requireRole("seller"), asyncHandler(async (req, res) => {
  const { result, note } = req.body;
  if (result !== "Pass" && result !== "Fail") {
    return res.status(400).json({ success: false, message: "result must be Pass or Fail" });
  }

  const ret = await ReturnRequest.findOne({ id: req.params.id });
  if (!ret) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  if (ret.status !== "Under Inspection") {
    return res.status(400).json({ success: false, message: `Inspection only applies while "Under Inspection" (currently "${ret.status}")` });
  }

  ret.inspection = { result, note };
  if (result === "Fail") {
    pushStatus(ret, "Rejected", note || "Failed inspection");
  } else {
    // stays Under Inspection until the admin approves the refund
    ret.statusHistory.push({ status: "Under Inspection", timestamp: new Date(), note: `Inspection passed${note ? `: ${note}` : ""}` });
  }
  await ret.save();
  await broadcast(ret, `Inspection: ${result}`);

  res.json({ success: true, return: ret });
}));

// POST /api/returns/:id/refund — admin processes the refund (Razorpay test
// refund for prepaid orders, a payout record for COD) and restocks items.
router.post("/:id/refund", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const ret = await ReturnRequest.findOne({ id: req.params.id });
  if (!ret) {
    return res.status(404).json({ success: false, message: "Return request not found" });
  }
  if (ret.status !== "Refund Approved") {
    return res.status(400).json({ success: false, message: `Refund can only be processed from "Refund Approved" (currently "${ret.status}")` });
  }

  const order = await Order.findOne({ id: ret.orderId });
  const amount = order ? order.amount : 0;
  const isPrepaid = order && order.paymentMethod === "Prepaid";

  const refund = await razorpay.refundPayment(isPrepaid ? order.razorpayPaymentId : null, amount);
  ret.refund = {
    amount,
    method: isPrepaid ? "Razorpay (test)" : "COD payout",
    refundId: refund.id,
    processedAt: new Date(),
  };
  pushStatus(ret, "Refunded", `₹${amount} via ${ret.refund.method}`);
  await ret.save();

  // put the returned units back in stock and mark the order returned
  for (const item of ret.items) {
    if (item.productId) {
      await Product.updateOne({ id: item.productId }, { $inc: { stock: item.qty || 1 } });
    }
  }
  if (order) {
    order.sellerStatus = "Returned";
    await order.save();
  }

  await broadcast(ret, `Refund of ₹${amount} processed`);
  await notifyRole("admin", "refund-processed", `Refund processed for ${ret.orderId}`, `₹${amount} via ${ret.refund.method}`, { returnId: ret.id });
  if (order && order.customerEmail) {
    await sendMail({ to: order.customerEmail, ...templates.refundConfirmed(order.customerName, order.id, amount) });
  }

  res.json({ success: true, return: ret });
}));

module.exports = router;
