// Feature 9 — Rating & Review. Users review products from delivered orders;
// reviews sit in admin moderation as Pending, and only Approved ones publish
// on the product page and count toward product/seller rating aggregates.

const express = require("express");
const router = express.Router();
const { Review, MODERATION_STATUSES } = require("../models/review.model");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Account } = require("../models/account.model");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { notifyRole, notifyUser } = require("../utils/notify");
const { emitToAll } = require("../realtime");

async function nextReviewId() {
  const reviews = await Review.find({}, "id").lean();
  const maxNum = reviews.reduce((max, r) => {
    const num = parseInt(String(r.id).replace("rev-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `rev-${maxNum + 1}`;
}

function averageOf(ratings) {
  if (!ratings.length) return { avg: 0, count: 0 };
  const sum = ratings.reduce((total, r) => total + r.rating, 0);
  return { avg: Math.round((sum / ratings.length) * 10) / 10, count: ratings.length };
}

// Recalculate the product's average from approved reviews, then roll the
// seller's aggregate up from all their products' approved reviews.
async function recalculateRatings(productId) {
  const product = await Product.findOne({ id: productId });
  if (!product) return;

  const productRatings = await Review.find({ productId, moderationStatus: "Approved" }, "rating").lean();
  const productAgg = averageOf(productRatings);
  product.rating = productAgg.avg;
  product.ratingCount = productAgg.count;
  await product.save();

  const sellerProducts = await Product.find({ sellerId: product.sellerId }, "id").lean();
  const sellerRatings = await Review.find(
    { productId: { $in: sellerProducts.map((p) => p.id) }, moderationStatus: "Approved" },
    "rating"
  ).lean();
  const sellerAgg = averageOf(sellerRatings);
  await Account.updateOne(
    { id: product.sellerId, role: "seller" },
    { sellerRating: sellerAgg.avg, sellerRatingCount: sellerAgg.count }
  );
}

// GET /api/reviews?productId=&moderationStatus=&userId=
// Public callers only ever see Approved reviews; the moderation queue
// (any status) is admin-only, and users can list their own reviews.
router.get("/", asyncHandler(async (req, res) => {
  const { productId, moderationStatus, userId } = req.query;
  const filter = {};

  const wantsNonPublic = moderationStatus !== undefined && moderationStatus !== "Approved";
  if (wantsNonPublic || userId) {
    const { getAuthFromHeader } = require("../middleware/auth");
    const auth = getAuthFromHeader(req);
    const isSelf = userId && auth && auth.id === userId;
    if (!auth || (auth.role !== "admin" && !isSelf)) {
      return res.status(403).json({ success: false, message: "You don't have access to these reviews" });
    }
    if (moderationStatus) filter.moderationStatus = moderationStatus;
    if (userId) filter.userId = userId;
  } else {
    filter.moderationStatus = "Approved";
    if (moderationStatus) filter.moderationStatus = moderationStatus;
  }
  if (productId) filter.productId = productId;

  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, reviews });
}));

// POST /api/reviews  { productId, orderId, rating, comment }
// Only for products in one of the caller's *delivered* orders.
router.post("/", requireAuth, requireRole("user"), asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;
  const numericRating = Number(rating);

  if (!productId || !orderId || !Number.isFinite(numericRating)) {
    return res.status(400).json({ success: false, message: "productId, orderId and rating are required" });
  }
  if (numericRating < 1 || numericRating > 5 || !Number.isInteger(numericRating)) {
    return res.status(400).json({ success: false, message: "rating must be a whole number from 1 to 5" });
  }
  if (comment !== undefined && (typeof comment !== "string" || comment.length > 2000)) {
    return res.status(400).json({ success: false, message: "comment must be text under 2000 characters" });
  }

  const order = await Order.findOne({ id: orderId, userId: req.auth.id });
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.sellerStatus !== "Delivered" && order.deliveryStatus !== "Delivered") {
    return res.status(400).json({ success: false, message: "You can only review products from delivered orders" });
  }
  const orderedItem = order.items.find((item) => item.productId === String(productId));
  if (!orderedItem) {
    return res.status(400).json({ success: false, message: "That product isn't part of this order" });
  }

  if (await Review.findOne({ userId: req.auth.id, productId: String(productId), orderId })) {
    return res.status(400).json({ success: false, message: "You've already reviewed this product for this order" });
  }

  const account = await Account.findOne({ id: req.auth.id });
  const review = await Review.create({
    id: await nextReviewId(),
    userId: req.auth.id,
    userName: account ? account.name : "Customer",
    productId: String(productId),
    productName: orderedItem.name,
    orderId,
    rating: numericRating,
    comment: comment || "",
  });

  await notifyRole("admin", "review-submitted", `New review pending moderation`, `${review.userName} rated ${review.productName} ${review.rating}★`, { reviewId: review.id, productId: review.productId });

  res.status(201).json({ success: true, review });
}));

// PATCH /api/reviews/:id/moderate  { moderationStatus } — admin approve/reject
router.patch("/:id/moderate", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { moderationStatus } = req.body;
  if (!MODERATION_STATUSES.includes(moderationStatus) || moderationStatus === "Pending") {
    return res.status(400).json({ success: false, message: "moderationStatus must be Approved or Rejected" });
  }

  const review = await Review.findOne({ id: req.params.id });
  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  review.moderationStatus = moderationStatus;
  await review.save();
  await recalculateRatings(review.productId);

  if (moderationStatus === "Approved") {
    // product pages listen for this to show the new review without a refresh
    emitToAll("review-published", { productId: review.productId, reviewId: review.id });
  }
  await notifyUser(review.userId, "review-submitted", `Your review was ${moderationStatus.toLowerCase()}`, `Review of ${review.productName}`, { reviewId: review.id, moderationStatus });

  res.json({ success: true, review });
}));

module.exports = router;
