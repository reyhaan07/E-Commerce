const express = require("express");
const router = express.Router();
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Order } = require("../models/order.model");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { deliveredAt } = require("../utils/payrollMath");

async function nextPartnerId() {
  const partners = await DeliveryPartner.find({}, "id").lean();
  const maxNum = partners.reduce((max, p) => {
    const num = parseInt(String(p.id).replace("partner-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `partner-${maxNum + 1}`;
}

function omitPassword(partnerDoc) {
  const { password, ...rest } = partnerDoc.toJSON();
  return rest;
}

// Lifetime + this-month delivery stats for a partner, computed from real
// orders (Feature 4 Profile tiles).
async function partnerStats(partnerId) {
  const jobs = await Order.find({ deliveryPartnerId: partnerId }, "deliveryStatus cancellation statusHistory createdAt").lean();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  let totalDelivered = 0;
  let totalCancelled = 0;
  let thisMonthDeliveries = 0;
  for (const job of jobs) {
    if (job.deliveryStatus === "Delivered") {
      totalDelivered += 1;
      if (deliveredAt(job) >= monthStart) thisMonthDeliveries += 1;
    } else if (job.cancellation && job.cancellation.status === "Approved") {
      totalCancelled += 1;
    }
  }
  const attempts = totalDelivered + totalCancelled;
  const successRate = attempts ? Math.round((totalDelivered / attempts) * 100) : 100;
  return { totalAssigned: jobs.length, totalDelivered, totalCancelled, thisMonthDeliveries, successRate };
}

// GET /api/delivery-partners
router.get("/", async (req, res) => {
  const partners = await DeliveryPartner.find();
  res.json({ success: true, deliveryPartners: partners.map(omitPassword) });
});

// GET /api/delivery-partners/me — the logged-in partner's own profile + stats
// (Feature 3/4). Defined before /:id-shaped routes so "me" is never treated
// as a partner id.
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.auth.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }
  const stats = await partnerStats(partner.id);
  res.json({ success: true, deliveryPartner: omitPassword(partner), stats });
}));

// PATCH /api/delivery-partners/me  { name, phone, vehicle, zone, status, avatar }
router.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.auth.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  const { name, phone, vehicle, zone, status, avatar } = req.body;
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "name cannot be blank" });
    }
    partner.name = name.trim();
  }
  if (phone !== undefined) partner.phone = phone;
  if (vehicle !== undefined) partner.vehicle = vehicle;
  if (zone !== undefined) partner.zone = zone;
  if (status !== undefined) partner.status = status;
  if (avatar !== undefined) partner.avatar = avatar;
  await partner.save();

  // keep denormalized name/phone on assigned orders in sync
  await Order.updateMany(
    { deliveryPartnerId: partner.id },
    { deliveryPartnerName: partner.name, deliveryPartnerPhone: partner.phone }
  );

  const stats = await partnerStats(partner.id);
  res.json({ success: true, deliveryPartner: omitPassword(partner), stats });
}));

// POST /api/delivery-partners  { name, email, password, phone, vehicle }
router.post("/", async (req, res) => {
  const { name, email, password, phone, vehicle } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email and password are required" });
  }
  if (await DeliveryPartner.findOne({ email })) {
    return res.status(400).json({ success: false, message: "A delivery partner with this email already exists" });
  }

  const partner = await DeliveryPartner.create({
    id: await nextPartnerId(),
    name,
    email,
    password,
    phone,
    vehicle: vehicle || "Bike",
  });

  res.status(201).json({ success: true, deliveryPartner: omitPassword(partner) });
});

// PUT /api/delivery-partners/:id  { name, phone, vehicle, status }
router.put("/:id", async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  const { name, phone, vehicle, status } = req.body;
  if (name !== undefined) partner.name = name;
  if (phone !== undefined) partner.phone = phone;
  if (vehicle !== undefined) partner.vehicle = vehicle;
  if (status !== undefined) partner.status = status;
  await partner.save();

  // Keep denormalized name/phone on any orders currently assigned to this partner in sync
  await Order.updateMany(
    { deliveryPartnerId: partner.id },
    { deliveryPartnerName: partner.name, deliveryPartnerPhone: partner.phone }
  );

  res.json({ success: true, deliveryPartner: omitPassword(partner) });
});

// DELETE /api/delivery-partners/:id
router.delete("/:id", async (req, res) => {
  const partner = await DeliveryPartner.findOneAndDelete({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  // Un-assign this partner from any orders rather than leaving dangling references
  await Order.updateMany(
    { deliveryPartnerId: partner.id },
    { deliveryPartnerId: null, deliveryPartnerName: null, deliveryPartnerPhone: null, deliveryStatus: null }
  );

  res.json({ success: true });
});

module.exports = router;
