// Return/refund requests (Feature 11). Each request walks the status chain
// below; every transition is appended to statusHistory with a timestamp.

const mongoose = require("mongoose");

const RETURN_STATUSES = [
  "Requested",
  "Admin Review",
  "Seller Approved",
  "Pickup Scheduled",
  "Picked Up",
  "Under Inspection",
  "Refund Approved",
  "Refunded",
  "Rejected",
];

const returnItemSchema = new mongoose.Schema(
  {
    productId: String,
    name: String,
    qty: { type: Number, default: 1 },
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    note: String,
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "RET-2001"
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  customerName: String,
  items: [returnItemSchema],
  reason: { type: String, required: true },
  photos: [String], // data URLs or http URLs
  status: { type: String, enum: RETURN_STATUSES, default: "Requested" },
  statusHistory: [statusHistoryEntrySchema],
  // reverse pickup, assigned like a delivery
  pickupPartnerId: { type: String, default: null },
  pickupPartnerName: { type: String, default: null },
  inspection: {
    result: { type: String, enum: ["Pass", "Fail", null], default: null },
    note: String,
  },
  refund: {
    amount: { type: Number, default: 0 },
    method: String, // "Razorpay (test)" or "COD payout"
    refundId: String,
    processedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
});

returnRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);

module.exports = { ReturnRequest, RETURN_STATUSES };
