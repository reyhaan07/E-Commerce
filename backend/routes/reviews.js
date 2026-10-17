// Feature 9 — Rating & Review. Users review products they had delivered, and
// the review publishes straight away: it appears on the product page and counts
// toward the product/seller rating aggregates the moment it is written. There
// is no approval queue — nobody signs off a customer's review.

const express = require("express");
const router = express.Router();
const { Review } = require("../models/review.model");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Account } = require("../models/account.model");
const { requireAuth, requireRole, requireActiveAccount } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { nextId } = require("../utils/sequence");
const { emitToAll } = require("../realtime");

async function nextReviewId() {
  return nextId("review", Review, "rev-");
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

// GET /api/reviews?productId=&userId=
// Reviews are public as soon as they're written, so there's nothing to gate
// here beyond a user listing their own.
router.get("/", asyncHandler(async (req, res) => {
  const { productId, userId } = req.query;
  const filter = {};

  if (userId) {
    const { getAuthFromHeader } = require("../middleware/auth");
    const auth = getAuthFromHeader(req);
    const isSelf = auth && auth.id === userId;
    if (!auth || (!isSelf && auth.role !== "admin")) {
      return res.status(403).json({ success: false, message: "You don't have access to these reviews" });
    }
    filter.userId = userId;
  }
  if (productId) filter.productId = productId;

  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, reviews });
}));

// POST /api/reviews  { productId, orderId, rating, comment }
// Only for products in one of the caller's *delivered* orders.
router.post("/", requireAuth, requireActiveAccount, requireRole("user"), asyncHandler(async (req, res) => {
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

  // Live immediately: fold it into the product/seller rating aggregates and
  // push it to anyone on the product page, the same way approval used to.
  await recalculateRatings(review.productId);
  emitToAll("review-published", { productId: review.productId, reviewId: review.id });

  res.status(201).json({ success: true, review });
}));


module.exports = router;
