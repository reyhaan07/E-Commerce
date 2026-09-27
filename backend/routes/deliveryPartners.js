const express = require("express");
const router = express.Router();
const { DeliveryPartner, ACCOUNT_STATUSES } = require("../models/deliveryPartner.model");
const { Order } = require("../models/order.model");
const { requireAuth, requireRole, requireActivePartner } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { deliveredAt } = require("../utils/payrollMath");
const { nextId } = require("../utils/sequence");
const { notifyRole, notifyUser } = require("../utils/notify");

async function nextPartnerId() {
  return nextId("deliveryPartner", DeliveryPartner, "partner-");
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
router.patch("/me", requireAuth, requireActivePartner, asyncHandler(async (req, res) => {
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

// POST /api/delivery-partners  { name, email, password, phone, vehicle }  (admin)
router.post("/", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { name, email, password, phone, vehicle, zone, pincode } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "name, email and password are required" });
  }
  if (await DeliveryPartner.findOne({ email })) {
    return res.status(400).json({ success: false, message: "A delivery partner with this email already exists" });
  }
  if (pincode !== undefined && String(pincode).trim() && !/^\d{6}$/.test(String(pincode).trim())) {
    return res.status(400).json({ success: false, message: "pincode must be a 6-digit PIN code" });
  }

  const partner = await DeliveryPartner.create({
    id: await nextPartnerId(),
    name,
    email,
    password,
    phone,
    vehicle: vehicle || "Bike",
    zone: zone || "",
    pincode: String(pincode || "").trim(),
  });

  res.status(201).json({ success: true, deliveryPartner: omitPassword(partner) });
}));

// PUT /api/delivery-partners/:id  { name, phone, vehicle, status }  (admin)
router.put("/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  const { name, phone, vehicle, status, zone, pincode } = req.body;
  if (name !== undefined) partner.name = name;
  if (phone !== undefined) partner.phone = phone;
  if (vehicle !== undefined) partner.vehicle = vehicle;
  if (status !== undefined) partner.status = status;
  if (zone !== undefined) partner.zone = zone;
  // Base PIN (gate 2). It decides which seller warehouses this partner can be
  // matched to, and until now there was no way to change it after creation.
  if (pincode !== undefined) {
    const pin = String(pincode).trim();
    if (pin && !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: "pincode must be a 6-digit PIN code" });
    }
    partner.pincode = pin;
  }
  await partner.save();

  // Keep denormalized name/phone on any orders currently assigned to this partner in sync
  await Order.updateMany(
    { deliveryPartnerId: partner.id },
    { deliveryPartnerName: partner.name, deliveryPartnerPhone: partner.phone }
  );

  res.json({ success: true, deliveryPartner: omitPassword(partner) });
}));

// DELETE /api/delivery-partners/:id  (admin) - deactivate the account.
// This used to hard-delete the row, which left the partner app looking live
// until their 7-day JWT expired. It is now a soft deactivation: the record (and
// the delivery history payroll reads) survives, the app can tell them their
// account was deactivated, and an admin can reverse it.
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  partner.accountStatus = "deactivated";
  partner.status = "Offline";
  await partner.save();

  // Un-assign from any live orders rather than leaving them with a partner who
  // can no longer act on them - same intent as the old hard delete, but it
  // leaves delivered history alone so payroll still counts it.
  await Order.updateMany(
    { deliveryPartnerId: partner.id, deliveryStatus: { $ne: "Delivered" } },
    { deliveryPartnerId: null, deliveryPartnerName: null, deliveryPartnerPhone: null, deliveryStatus: null }
  );

  await notifyUser(partner.id, "partner-account-status", "Your account has been deactivated",
    "A platform administrator deactivated your delivery partner account.", { accountStatus: "deactivated" });

  res.json({ success: true, deliveryPartner: omitPassword(partner) });
}));

// PATCH /api/delivery-partners/:id/account-status  { accountStatus, reason? }  (admin)
// Suspend / reactivate / deactivate a partner. Separate from PUT /:id so the
// operational `status` field can never be confused with account standing.
router.patch("/:id/account-status", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { accountStatus, reason } = req.body;
  if (!ACCOUNT_STATUSES.includes(accountStatus)) {
    return res.status(400).json({ success: false, message: `accountStatus must be one of: ${ACCOUNT_STATUSES.join(", ")}` });
  }

  const partner = await DeliveryPartner.findOne({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }

  partner.accountStatus = accountStatus;
  if (accountStatus === "active") {
    // Reinstating clears any open appeal so the partner is not left looking at
    // a stale "pending" banner.
    if (partner.unsuspensionRequest && partner.unsuspensionRequest.status === "pending") {
      partner.unsuspensionRequest.status = "approved";
      partner.unsuspensionRequest.reviewedAt = new Date();
      partner.unsuspensionRequest.reviewedBy = req.auth.id;
    }
  } else {
    partner.status = "Offline";
    await Order.updateMany(
      { deliveryPartnerId: partner.id, deliveryStatus: { $ne: "Delivered" } },
      { deliveryPartnerId: null, deliveryPartnerName: null, deliveryPartnerPhone: null, deliveryStatus: null }
    );
  }
  if (reason !== undefined) partner.unsuspensionRequest.reason = reason;
  await partner.save();

  const TITLES = {
    active: "Your account has been reinstated",
    suspended: "Your account has been suspended",
    deactivated: "Your account has been deactivated",
  };
  await notifyUser(partner.id, "partner-account-status", TITLES[accountStatus],
    reason || `Your delivery partner account is now ${accountStatus}.`, { accountStatus });

  res.json({ success: true, deliveryPartner: omitPassword(partner) });
}));

// POST /api/delivery-partners/me/unsuspension-request  { message? }
// A suspended partner appeals. Deliberately NOT behind requireActivePartner -
// that middleware exists to block suspended partners, and this is the one
// thing they must still be able to do.
router.post("/me/unsuspension-request", requireAuth, asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ id: req.auth.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }
  if ((partner.accountStatus || "active") !== "suspended") {
    return res.status(400).json({ success: false, message: "Only a suspended account can request a review." });
  }
  if (partner.unsuspensionRequest && partner.unsuspensionRequest.status === "pending") {
    return res.status(400).json({ success: false, message: "Your request is already with the admin team." });
  }

  const { message } = req.body;
  if (message !== undefined && typeof message !== "string") {
    return res.status(400).json({ success: false, message: "message must be text" });
  }
  if (typeof message === "string" && message.length > 1000) {
    return res.status(400).json({ success: false, message: "message must be under 1000 characters" });
  }

  partner.unsuspensionRequest = {
    status: "pending",
    message: (message || "").trim(),
    requestedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    reason: "",
  };
  await partner.save();

  await notifyRole("admin", "partner-unsuspension-request", "Unsuspension request",
    `${partner.name} has asked for their delivery partner account to be reinstated.`,
    { partnerId: partner.id, partnerName: partner.name, message: partner.unsuspensionRequest.message });

  res.status(201).json({ success: true, deliveryPartner: omitPassword(partner) });
}));

// PATCH /api/delivery-partners/:id/unsuspension-request  { decision, reason? }  (admin)
// Approve (reinstates the account) or reject (it stays suspended) an appeal.
router.patch("/:id/unsuspension-request", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { decision, reason } = req.body;
  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ success: false, message: "decision must be approved or rejected" });
  }

  const partner = await DeliveryPartner.findOne({ id: req.params.id });
  if (!partner) {
    return res.status(404).json({ success: false, message: "Delivery partner not found" });
  }
  if (!partner.unsuspensionRequest || partner.unsuspensionRequest.status !== "pending") {
    return res.status(400).json({ success: false, message: "This partner has no pending request." });
  }

  partner.unsuspensionRequest.status = decision;
  partner.unsuspensionRequest.reviewedAt = new Date();
  partner.unsuspensionRequest.reviewedBy = req.auth.id;
  partner.unsuspensionRequest.reason = (reason || "").trim();
  if (decision === "approved") partner.accountStatus = "active";
  await partner.save();

  await notifyUser(partner.id, "partner-unsuspension-request",
    decision === "approved" ? "Your account has been reinstated" : "Your reinstatement request was declined",
    partner.unsuspensionRequest.reason || (decision === "approved"
      ? "You can sign back in and take deliveries again."
      : "Your account remains suspended."),
    { decision, accountStatus: partner.accountStatus });

  res.json({ success: true, deliveryPartner: omitPassword(partner) });
}));

module.exports = router;
