// Admin-console data: account management tables and dashboard stats.

const express = require("express");
const router = express.Router();
const { Account, ROLES, ACCOUNT_STATUSES } = require("../models/account.model");
const { Order } = require("../models/order.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { ReturnRequest } = require("../models/returnRequest.model");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

router.use(requireAuth, requireRole("admin"));

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

// GET /api/admin/stats — dashboard tiles + analytics aggregates
router.get("/stats", asyncHandler(async (req, res) => {
  const [users, sellers, products, orders, activeCarts, pendingReviews, openReturns, revenueAgg, ordersByStatus] =
    await Promise.all([
      Account.countDocuments({ role: "user" }),
      Account.countDocuments({ role: "seller" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Account.countDocuments({ role: "user", "cart.0": { $exists: true } }),
      Review.countDocuments({ moderationStatus: "Pending" }),
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
      pendingReviews,
      openReturns,
      revenue: revenueAgg.length ? revenueAgg[0].total : 0,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count])),
    },
  });
}));

module.exports = router;
