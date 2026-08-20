// Mongoose schema for an Order. `id` (e.g. "ORD-1001") is the business key
// used everywhere in the API/frontends; Mongo's own `_id`/`__v` are stripped
// from JSON responses so the API shape is unchanged from the old in-memory store.

const mongoose = require("mongoose");

const SELLER_STATUSES = [
  "Processing",
  "Accepted",
  "Packed",
  "Ready For Dispatch",
  "Shipped",
  "Delivered",
  "Returned",
  "Cancelled",
  "Rejected",
];

// Which seller statuses may follow which. Enforced in the seller-status route
// so an order can't skip from "Processing" straight to "Delivered".
// "Shipped" is normally reached automatically when the courier marks pickup.
const SELLER_TRANSITIONS = {
  Processing: ["Accepted", "Rejected", "Cancelled"],
  Accepted: ["Packed", "Cancelled"],
  Packed: ["Ready For Dispatch", "Cancelled"],
  "Ready For Dispatch": ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: ["Returned"],
  Returned: [],
  Cancelled: [],
  Rejected: [],
};

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

// One hop in the order's life. `phase` disambiguates statuses that exist on
// both sides of the handover — a seller "Accepted" and a courier "Accepted"
// are different events and must not collapse into one timeline entry.
const statusHistoryEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    phase: { type: String, enum: ["order", "seller", "delivery"], default: "delivery" },
    actor: { type: String, enum: ["system", "user", "seller", "admin", "delivery"], default: "system" },
    note: { type: String, default: "" },
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

// The end-to-end journey a buyer and a seller both see, in order. It spans the
// seller phase (which the buyer previously couldn't see at all) and the
// delivery phase, so one timeline tells the whole story.
const ORDER_JOURNEY = [
  { key: "Placed", phase: "order", label: "Order placed", description: "We received the order and payment details." },
  { key: "Accepted", phase: "seller", label: "Accepted by seller", description: "The seller confirmed they can fulfil this order." },
  { key: "Packed", phase: "seller", label: "Packed", description: "Items picked and packed, waiting on a courier." },
  { key: "Ready For Dispatch", phase: "seller", label: "Ready for dispatch", description: "Handover to the courier requested." },
  { key: "Assigned", phase: "delivery", label: "Courier assigned", description: "A delivery partner is allocated." },
  { key: "Picked Up", phase: "delivery", label: "Picked up", description: "The courier collected the parcel." },
  { key: "In Transit", phase: "delivery", label: "In transit", description: "On its way to the destination hub." },
  { key: "Out For Delivery", phase: "delivery", label: "Out for delivery", description: "Arriving today." },
  { key: "Delivered", phase: "delivery", label: "Delivered", description: "Handed to the customer." },
];

// Statuses that end the journey early; when one is present the remaining
// steps are reported as "halted" rather than "upcoming".
const TERMINAL_SELLER_STATUSES = ["Cancelled", "Rejected", "Returned"];

// Folds statusHistory into ORDER_JOURNEY and marks each step done / current /
// upcoming. Computed server-side so the seller console and the storefront can
// never drift apart on what the timeline means.
// How far the seller phase has advanced, independent of history. Orders seeded
// before the timeline existed carry no seller-phase entries, so progress is
// inferred from the current status as a fallback.
const SELLER_PROGRESS = ["Processing", "Accepted", "Packed", "Ready For Dispatch", "Shipped", "Delivered"];

function buildJourney(order) {
  const history = order.statusHistory || [];
  const entryFor = (step) =>
    history.find((h) => h.status === step.key && (h.phase || "delivery") === step.phase) || null;

  const sellerRank = SELLER_PROGRESS.indexOf(order.sellerStatus);
  const deliveryRank = order.deliveryStatus ? DELIVERY_STATUSES.indexOf(order.deliveryStatus) : -1;

  // A step counts as reached if it was recorded, or if the current status
  // implies it must already have happened.
  function isReached(step) {
    if (step.phase === "order") return true; // the order exists, so it was placed
    if (entryFor(step)) return true;
    if (step.phase === "seller") {
      const stepRank = SELLER_PROGRESS.indexOf(step.key);
      return stepRank >= 0 && sellerRank >= stepRank;
    }
    const stepRank = DELIVERY_STATUSES.indexOf(step.key);
    return stepRank >= 0 && deliveryRank >= stepRank;
  }

  let lastReachedIndex = -1;
  ORDER_JOURNEY.forEach((step, i) => {
    if (isReached(step)) lastReachedIndex = i;
  });

  const halted = TERMINAL_SELLER_STATUSES.includes(order.sellerStatus);
  const finished = order.deliveryStatus === "Delivered";

  const steps = ORDER_JOURNEY.map((step, i) => {
    const entry = entryFor(step);
    let state;
    if (i < lastReachedIndex) state = "done";
    else if (i === lastReachedIndex) state = finished ? "done" : "current";
    else state = halted ? "halted" : "upcoming";

    return {
      key: step.key,
      phase: step.phase,
      label: step.label,
      description: step.description,
      state,
      // fall back to the order date for the "Placed" step on legacy orders
      timestamp: entry ? entry.timestamp : (step.phase === "order" ? order.createdAt : null),
      actor: entry ? entry.actor : null,
      note: entry ? entry.note : "",
    };
  });

  return {
    steps,
    halted,
    haltedReason: halted ? order.sellerStatus : null,
    sellerStatus: order.sellerStatus,
    deliveryStatus: order.deliveryStatus,
  };
}

module.exports = {
  Order,
  SELLER_STATUSES,
  SELLER_TRANSITIONS,
  DELIVERY_STATUSES,
  PAYMENT_METHODS,
  CANCELLATION_STATUSES,
  ORDER_JOURNEY,
  buildJourney,
};
