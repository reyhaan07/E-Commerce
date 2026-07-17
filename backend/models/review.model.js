// Product reviews with admin moderation. Only reviews with
// moderationStatus "Approved" are shown publicly and counted in the
// product/seller rating aggregates.

const mongoose = require("mongoose");

const MODERATION_STATUSES = ["Pending", "Approved", "Rejected"];

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: String,
  productId: { type: String, required: true },
  productName: String,
  orderId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  moderationStatus: { type: String, enum: MODERATION_STATUSES, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.index({ productId: 1, moderationStatus: 1 });
// one review per product per order per user
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

reviewSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = { Review, MODERATION_STATUSES };
