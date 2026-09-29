// Per-item cancellation eligibility.
//
// Pure, database-free logic so the route, the customer storefront and the tests
// all answer the question the same way. The frontend uses it to decide whether
// to offer a Cancel button; the backend re-evaluates it against freshly read
// data at the moment of the write, because the seller can pack an item between
// the customer opening the modal and confirming it.
//
// There are no per-item statuses in this project — cancellability is derived
// from the order's own sellerStatus/deliveryStatus plus the item's cancelled
// flag. See models/order.model.js.

// The cancellation window closes when the parcel physically leaves the seller,
// not when it is packed. Packing and labelling are reversible desk work; once a
// courier has collected the parcel there is nothing to call back.
//
// An in-stock order is auto-accepted on creation, so "Accepted" is where most
// orders actually sit — leaving it out is what made the old order-level cancel
// route unusable for normal orders.
const CANCELLABLE_SELLER_STATUSES = ["Processing", "Accepted", "Packed", "Ready For Dispatch"];

// Courier states where the parcel is still sitting with the seller. A partner
// being assigned, or accepting the job, does not mean they have it yet — only
// "Picked Up" onwards is real custody. `null` covers orders with no courier.
const PRE_PICKUP_DELIVERY_STATUSES = [null, "Assigned", "Accepted"];

// Copy shown to the customer. Keyed by reason so the API, UI and tests share it.
const CANCEL_REFUSAL = {
  "already-cancelled": "This item has already been cancelled.",
  "picked-up": "This item cannot be cancelled because the courier has already collected it.",
  "in-transit": "This item cannot be cancelled because it is already in transit.",
  shipped: "This item cannot be cancelled because it has already been dispatched.",
  delivered: "This item has been delivered. You can request a return instead.",
  "order-closed": "This order is already closed.",
  "out-for-delivery": "This item cannot be cancelled because it is out for delivery.",
  "not-owner": "Only the owner of this order can cancel this item.",
  "not-cancellable": "This item can no longer be cancelled.",
};

// The reasons the customer may pick. "Other" requires a free-text note.
const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "No longer needed",
  "Wrong product ordered",
  "Delivery taking too long",
  "Other",
];

// { allowed, reason, message }. `reason` is a stable machine key; `message` is
// what the customer reads.
function canCancelItem(order, item) {
  if (!order || !item) {
    return { allowed: false, reason: "not-cancellable", message: CANCEL_REFUSAL["not-cancellable"] };
  }
  if (item.cancelled) {
    return { allowed: false, reason: "already-cancelled", message: CANCEL_REFUSAL["already-cancelled"] };
  }

  // Courier custody outranks the seller status. Assignment alone is not
  // custody — the partner may not have reached the shop yet — so only pickup
  // and beyond close the window.
  const delivery = order.deliveryStatus;
  if (delivery === "Delivered") {
    return { allowed: false, reason: "delivered", message: CANCEL_REFUSAL.delivered };
  }
  if (delivery === "Out For Delivery") {
    return { allowed: false, reason: "out-for-delivery", message: CANCEL_REFUSAL["out-for-delivery"] };
  }
  if (delivery === "In Transit") {
    return { allowed: false, reason: "in-transit", message: CANCEL_REFUSAL["in-transit"] };
  }
  if (delivery === "Picked Up") {
    return { allowed: false, reason: "picked-up", message: CANCEL_REFUSAL["picked-up"] };
  }

  switch (order.sellerStatus) {
    case "Shipped":
      return { allowed: false, reason: "shipped", message: CANCEL_REFUSAL.shipped };
    case "Delivered":
      return { allowed: false, reason: "delivered", message: CANCEL_REFUSAL.delivered };
    case "Cancelled":
    case "Rejected":
    case "Returned":
      return { allowed: false, reason: "order-closed", message: CANCEL_REFUSAL["order-closed"] };
    default:
      break;
  }

  if (!CANCELLABLE_SELLER_STATUSES.includes(order.sellerStatus)) {
    return { allowed: false, reason: "not-cancellable", message: CANCEL_REFUSAL["not-cancellable"] };
  }

  return { allowed: true, reason: null, message: null };
}

// What a single cancelled line is worth back. Shipping is charged once per
// order, so it is only released when the whole order ends up cancelled —
// cancelling one line out of three doesn't refund the delivery fee.
function itemRefundAmount(item) {
  return Math.round((Number(item.price) || 0) * (Number(item.qty) || 0) * 100) / 100;
}

// Every line either already cancelled, or cancelled by this request.
function allItemsCancelled(order, justCancelledItemId = null) {
  return (order.items || []).every((i) => i.cancelled || (justCancelledItemId && i.itemId === justCancelledItemId));
}

module.exports = {
  CANCELLABLE_SELLER_STATUSES,
  PRE_PICKUP_DELIVERY_STATUSES,
  CANCEL_REFUSAL,
  CANCEL_REASONS,
  canCancelItem,
  itemRefundAmount,
  allItemsCancelled,
};
