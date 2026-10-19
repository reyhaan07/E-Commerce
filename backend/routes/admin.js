// Admin-console data: account management tables and dashboard stats.

const express = require("express");
const router = express.Router();
const { Account, ROLES, ACCOUNT_STATUSES, ADMIN_ROLES } = require("../models/account.model");
const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { ReturnRequest } = require("../models/returnRequest.model");
const { requireAuth, requireRole, requireSuperAdmin, SYSTEM_SUPER_ADMIN_EMAIL } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyUser } = require("../utils/notify");

router.use(requireAuth, requireRole("admin"));

// ── Admin roster (SUPER_ADMIN only) ──────────────────────────────────────
// Every route below is gated by requireSuperAdmin, which re-reads the caller's
// tier from the database so a demotion takes effect before their JWT expires.

async function nextAdminId() {
  const admins = await Account.find({ role: "admin" }, "id").lean();
  const maxNum = admins.reduce((max, a) => {
    const num = parseInt(String(a.id).replace("admin-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `admin-${maxNum + 1}`;
}

function isEmailShaped(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// The founding admin stays a SUPER_ADMIN and stays active, so the console can
// never be locked out of its own roster.
function isSystemSuperAdmin(account) {
  return account.email === SYSTEM_SUPER_ADMIN_EMAIL;
}

// GET /api/admin/admins?search=&status=
router.get("/admins", requireSuperAdmin, asyncHandler(async (req, res) => {
  const filter = { role: "admin" };
  if (req.query.status) {
    if (!ACCOUNT_STATUSES.includes(req.query.status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    filter.status = req.query.status;
  }
  if (req.query.search && String(req.query.search).trim()) {
    // escaped so a search for "a.b" can't be read as a regex
    const term = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(term, "i");
    filter.$or = [{ name: rx }, { email: rx }, { jobTitle: rx }];
  }
  const admins = await Account.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, admins });
}));

// POST /api/admin/admins  { name, email, password, confirmPassword, adminRole?, phone?, jobTitle? }
router.post("/admins", requireSuperAdmin, asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, adminRole, phone, jobTitle } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  if (!isEmailShaped(email)) {
    return res.status(400).json({ success: false, message: "A valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }
  if (adminRole !== undefined && !ADMIN_ROLES.includes(adminRole)) {
    return res.status(400).json({ success: false, message: "Invalid adminRole" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await Account.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, message: "An account with that email already exists" });
  }

  // password is hashed by the model's pre-save hook
  const admin = await Account.create({
    id: await nextAdminId(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "admin",
    adminRole: adminRole || "ADMIN",
    phone: typeof phone === "string" ? phone.trim() : "",
    jobTitle: typeof jobTitle === "string" ? jobTitle.trim() : "",
    status: "active",
  });

  res.status(201).json({ success: true, admin });
}));

// PATCH /api/admin/admins/:id  { name?, email?, adminRole?, phone?, jobTitle?, status? }
router.patch("/admins/:id", requireSuperAdmin, asyncHandler(async (req, res) => {
  const admin = await Account.findOne({ id: req.params.id, role: "admin" });
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  const { name, email, adminRole, phone, jobTitle, status } = req.body;

  if (email !== undefined) {
    if (!isEmailShaped(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== admin.email) {
      if (isSystemSuperAdmin(admin)) {
        return res.status(400).json({ success: false, message: "The founding admin's email cannot be changed" });
      }
      if (await Account.findOne({ email: normalizedEmail })) {
        return res.status(409).json({ success: false, message: "An account with that email already exists" });
      }
      admin.email = normalizedEmail;
    }
  }
  if (adminRole !== undefined) {
    if (!ADMIN_ROLES.includes(adminRole)) {
      return res.status(400).json({ success: false, message: "Invalid adminRole" });
    }
    if (isSystemSuperAdmin(admin) && adminRole !== "SUPER_ADMIN") {
      return res.status(400).json({ success: false, message: "The founding admin cannot be demoted" });
    }
    admin.adminRole = adminRole;
  }
  if (status !== undefined) {
    if (!ACCOUNT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    if (isSystemSuperAdmin(admin) && status !== "active") {
      return res.status(400).json({ success: false, message: "The founding admin cannot be suspended" });
    }
    admin.status = status;
  }
  if (typeof name === "string" && name.trim()) admin.name = name.trim();
  if (typeof phone === "string") admin.phone = phone.trim();
  if (typeof jobTitle === "string") admin.jobTitle = jobTitle.trim();

  await admin.save();
  res.json({ success: true, admin });
}));

// PATCH /api/admin/admins/:id/status  { status }
router.patch("/admins/:id/status", requireSuperAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ACCOUNT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const admin = await Account.findOne({ id: req.params.id, role: "admin" });
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }
  if (isSystemSuperAdmin(admin) && status !== "active") {
    return res.status(400).json({ success: false, message: "The founding admin cannot be suspended" });
  }
  admin.status = status;
  await admin.save();
  res.json({ success: true, admin });
}));

// PATCH /api/admin/admins/:id/password  { password, confirmPassword }
router.patch("/admins/:id/password", requireSuperAdmin, asyncHandler(async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match" });
  }
  const admin = await Account.findOne({ id: req.params.id, role: "admin" });
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }
  admin.password = password; // hashed by the pre-save hook
  await admin.save();
  res.json({ success: true, message: "Password updated" });
}));

// DELETE /api/admin/admins/:id
router.delete("/admins/:id", requireSuperAdmin, asyncHandler(async (req, res) => {
  const admin = await Account.findOne({ id: req.params.id, role: "admin" });
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }
  if (isSystemSuperAdmin(admin)) {
    return res.status(400).json({ success: false, message: "The founding admin cannot be deleted" });
  }
  if (admin.id === req.auth.id) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account" });
  }
  await Account.deleteOne({ id: admin.id });
  res.json({ success: true, message: "Admin removed" });
}));

// GET /api/admin/accounts?role=user|seller
router.get("/accounts", asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) {
    if (!ROLES.includes(req.query.role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    filter.role = req.query.role;
  }
  const accounts = await Account.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, accounts });
}));

// PATCH /api/admin/accounts/:id/status  { status }
router.patch("/accounts/:id/status", asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ACCOUNT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const account = await Account.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  if (!account) {
    return res.status(404).json({ success: false, message: "Account not found" });
  }
  res.json({ success: true, account });
}));

// PATCH /api/admin/accounts/:id/verification  { verificationStatus, reason? }
// Approve / reject (Suspended) a seller store and notify the seller in real
// time. A rejection can carry an optional reason (Feature 6).
router.patch("/accounts/:id/verification", asyncHandler(async (req, res) => {
  const { verificationStatus, reason } = req.body;
  if (!["Pending", "Verified", "Suspended"].includes(verificationStatus)) {
    return res.status(400).json({ success: false, message: "Invalid verificationStatus" });
  }

  const account = await Account.findOne({ id: req.params.id, role: "seller" });
  if (!account) {
    return res.status(404).json({ success: false, message: "Seller not found" });
  }

  account.verificationStatus = verificationStatus;
  account.verificationReason = verificationStatus === "Suspended" ? (reason || "") : "";
  await account.save();

  // notify the seller of the decision
  if (verificationStatus === "Verified") {
    await notifyUser(
      account.id,
      "seller-approved",
      "Your store has been verified",
      "You now have full seller access — you can publish products and manage orders.",
      { sellerId: account.id }
    );
  } else if (verificationStatus === "Suspended") {
    await notifyUser(
      account.id,
      "seller-rejected",
      "Your seller application was rejected",
      reason ? `Reason: ${reason}` : "Please review your submitted details and documents.",
      { sellerId: account.id, reason: reason || "" }
    );
  }

  res.json({ success: true, account });
}));

// GET /api/admin/stats — dashboard tiles + analytics aggregates
router.get("/stats", asyncHandler(async (req, res) => {
  const [users, sellers, products, orders, activeCarts, openReturns, revenueAgg, ordersByStatus] =
    await Promise.all([
      Account.countDocuments({ role: "user" }),
      Account.countDocuments({ role: "seller" }),
      Product.countDocuments({ isArchived: { $ne: true } }),
      Order.countDocuments(),
      Account.countDocuments({ role: "user", "cart.0": { $exists: true } }),
      ReturnRequest.countDocuments({ status: { $nin: ["Refunded", "Rejected"] } }),
      Order.aggregate([
        { $match: { sellerStatus: { $nin: ["Cancelled", "Returned"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.aggregate([{ $group: { _id: "$sellerStatus", count: { $sum: 1 } } }]),
    ]);

  res.json({
    success: true,
    stats: {
      users,
      sellers,
      products,
      orders,
      activeCarts,
      openReturns,
      revenue: revenueAgg.length ? revenueAgg[0].total : 0,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count])),
    },
  });
}));

module.exports = router;
