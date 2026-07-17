// Mongoose schema for an Order. `id` (e.g. "ORD-1001") is the business key
// used everywhere in the API/frontends; Mongo's own `_id`/`__v` are stripped
// from JSON responses so the API shape is unchanged from the old in-memory store.

const mongoose = require("mongoose");

const SELLER_STATUSES = [
  "Processing",
  "Ready For Dispatch",
  "Shipped",
  "Delivered",
  "Returned",
  "Cancelled",
];

const DELIVERY_STATUSES = [
  "Assigned",
  "Accepted",
  "Picked Up",
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

const orderItemSchema = new mongoose.Schema(
  {
    productId: String, // Product.id — optional so old seed orders still validate
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, default: 0 }, // unit price at purchase time
  },
  { _id: false }
);

const CANCELLATION_STATUSES = ["Requested", "Approved", "Rejected"];

const cancellationSchema = new mongoose.Schema(
  {
    requested: { type: Boolean, default: false },
    reason: String,
    status: { type: String, enum: [...CANCELLATION_STATUSES, null], default: null },
    requestedAt: Date,
    resolvedAt: Date,
    resolutionNote: String,
    refundId: String,
    refundAmount: Number,
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const PAYMENT_METHODS = ["Prepaid", "Cash on Delivery"];

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  trackingId: { type: String, default: null }, // "TRK-xxxx", generated on partner assignment
  userId: { type: String, default: null }, // links to Account.id when the order was placed by a logged in user
  customerName: { type: String, required: true },
  customerEmail: String,
  customerPhone: String,
  customerAddress: String,
  items: [orderItemSchema],
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "Prepaid" },
  // Razorpay test-mode ids (null for Cash on Delivery)
  razorpayOrderId: { type: String, default: null },
  razorpayPaymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  // Seller-facing lifecycle (set by the Seller app)
  sellerId: { type: String, default: null }, // Account.id of the seller
  sellerName: { type: String, default: "ShopSphere Store" },
  sellerAddress: String,
  sellerPhone: String,
  sellerStatus: { type: String, enum: SELLER_STATUSES, default: "Processing" },
  // Seller flags the order ready for a delivery partner (Feature 7 step 9);
  // admin's Assign Deliveries page surfaces these first.
  pickupRequested: { type: Boolean, default: false },
  // Set by the seller after the partner marks Delivered (Feature 7 step 14)
  sellerConfirmedDelivery: { type: Boolean, default: false },
  // Set by admin to close out the order (Feature 7 step 14)
  completed: { type: Boolean, default: false },
  cancellation: { type: cancellationSchema, default: () => ({}) },
  // Delivery-facing lifecycle (set by Admin assignment + Delivery Partner app)
  deliveryStatus: { type: String, enum: [...DELIVERY_STATUSES, null], default: null },
  deliveryPartnerId: { type: String, default: null },
  deliveryPartnerName: { type: String, default: null },
  deliveryPartnerPhone: { type: String, default: null },
  statusHistory: [statusHistoryEntrySchema],
});

orderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order, SELLER_STATUSES, DELIVERY_STATUSES, PAYMENT_METHODS, CANCELLATION_STATUSES };
