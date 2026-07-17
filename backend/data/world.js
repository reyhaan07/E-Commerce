// Builds the transactional demo world — orders across every lifecycle
// state, reviews, cancellations, returns and notifications — as a pure
// deterministic function of the product catalog and the people lists.

const { PARTNERS } = require("./people");

// tiny deterministic RNG so "random" choices reseed identically every time
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_DAY = Date.UTC(2026, 4, 16); // 16 May 2026, ~60 days before "today"
const DAY = 24 * 60 * 60 * 1000;

// order state plan: [count, sellerStatus, deliveryStatus, flags]
const STATE_PLAN = [
  [6, "Processing", null, {}],
  [2, "Cancelled", null, { cancelledApproved: true }],
  [4, "Ready For Dispatch", null, {}],
  [4, "Ready For Dispatch", null, { pickupRequested: true }],
  [4, "Ready For Dispatch", "Assigned", { pickupRequested: true }],
  [3, "Ready For Dispatch", "Accepted", { pickupRequested: true }],
  [3, "Shipped", "Picked Up", { pickupRequested: true }],
  [3, "Shipped", "In Transit", { pickupRequested: true }],
  [3, "Shipped", "Out For Delivery", { pickupRequested: true }],
  [22, "Delivered", "Delivered", { pickupRequested: true, confirmed: true }],
  [8, "Delivered", "Delivered", { pickupRequested: true, confirmed: true, completed: true }],
];

const DELIVERY_SEQUENCE = ["Assigned", "Accepted", "Picked Up", "In Transit", "Out For Delivery", "Delivered"];

const REVIEW_VOICES = [
  [5, "Absolutely worth it — quality is even better than the photos."],
  [5, "Superb build and fast delivery. Would happily buy again."],
  [5, "Exceeded expectations. My whole family loves it."],
  [5, "Great value for the price. Packaging was excellent too."],
  [4, "Very good overall, just wish the instructions were clearer."],
  [4, "Solid product. Delivery partner was polite and on time."],
  [4, "Does exactly what it promises. Minor scuff on the box, product fine."],
  [4, "Happy with the purchase — colour is slightly different from the listing."],
  [3, "Decent, but I expected a bit more at this price."],
  [3, "Okay product. Works, but the finish feels average."],
  [2, "Disappointed — stopped working properly within a week. Support was helpful though."],
  [2, "Not as described. The size runs smaller than the chart."],
  [5, "Bought this for a gift and it was a huge hit!"],
  [4, "Sturdy and well made. Setup took ten minutes."],
  [3, "Average experience. Delivery was quick, product is just fine."],
  [5, "Third time ordering from this store — always reliable."],
];

function buildWorld(products, users) {
  const rng = mulberry32(42);
  const approved = products.filter((p) => p.approvalStatus === "Approved" && p.stock > 0);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  const orders = [];
  const reviews = [];
  const returns = [];
  const notifications = [];

  // --- Orders ---------------------------------------------------------
  let orderNumber = 1000;
  let stateEntries = [];
  for (const [count, sellerStatus, deliveryStatus, flags] of STATE_PLAN) {
    for (let i = 0; i < count; i++) stateEntries.push([sellerStatus, deliveryStatus, flags]);
  }

  stateEntries.forEach(([sellerStatus, deliveryStatus, flags], i) => {
    orderNumber += 1;
    const id = `ORD-${orderNumber}`;
    const user = users[i % users.length];
    const isDelivered = deliveryStatus === "Delivered";

    // delivered orders carry 3-5 items so the review volume is realistic;
    // one order belongs to one seller, so every item comes from the same store
    const itemCount = isDelivered ? 3 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
    const sellerId = pick(approved).sellerId;
    const sellerItems = approved.filter((p) => p.sellerId === sellerId);
    const chosen = [];
    while (chosen.length < Math.min(itemCount, sellerItems.length)) {
      const product = pick(sellerItems);
      if (!chosen.find((c) => c.id === product.id)) chosen.push(product);
    }
    const items = chosen.map((p) => ({
      productId: p.id,
      name: p.name,
      qty: 1 + Math.floor(rng() * 2),
      price: p.price,
    }));
    const amount = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const createdAt = new Date(BASE_DAY + i * DAY + Math.floor(rng() * 12) * 60 * 60 * 1000);
    const prepaid = i % 3 !== 0;

    // build the status history up to the order's current delivery status
    const statusHistory = [];
    if (deliveryStatus) {
      const upto = DELIVERY_SEQUENCE.indexOf(deliveryStatus);
      for (let s = 0; s <= upto; s++) {
        statusHistory.push({ status: DELIVERY_SEQUENCE[s], timestamp: new Date(createdAt.getTime() + (s + 1) * 5 * 60 * 60 * 1000) });
      }
    }

    const partnerIndex = deliveryStatus ? i % PARTNERS.length : -1;
    const address = user.addresses[0];

    const order = {
      id,
      trackingId: deliveryStatus ? `TRK-${String(1000 + orderNumber).slice(-4)}${"ABCDEFGHIJ"[i % 10]}` : null,
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerAddress: `${address.line1}, ${address.line2}, ${address.city} ${address.pincode}`,
      items,
      amount,
      paymentMethod: prepaid ? "Prepaid" : "Cash on Delivery",
      razorpayOrderId: prepaid ? `order_seed_${orderNumber}` : null,
      razorpayPaymentId: prepaid ? `pay_seed_${orderNumber}` : null,
      createdAt,
      sellerId,
      sellerName: null, // filled by the seed from the seller account
      sellerStatus,
      pickupRequested: Boolean(flags.pickupRequested),
      sellerConfirmedDelivery: Boolean(flags.confirmed),
      completed: Boolean(flags.completed),
      deliveryStatus,
      deliveryPartnerId: partnerIndex >= 0 ? `partner-${partnerIndex + 1}` : null,
      deliveryPartnerName: partnerIndex >= 0 ? PARTNERS[partnerIndex][0] : null,
      deliveryPartnerPhone: partnerIndex >= 0 ? `9${String(870000000 + partnerIndex * 6733).slice(0, 9)}` : null,
      statusHistory,
      cancellation: {},
    };

    if (flags.cancelledApproved) {
      order.cancellation = {
        requested: true,
        reason: i % 2 ? "Found a better price elsewhere" : "Ordered by mistake",
        status: "Approved",
        requestedAt: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000),
        resolvedAt: new Date(createdAt.getTime() + 20 * 60 * 60 * 1000),
        resolutionNote: "Approved before dispatch",
        refundId: prepaid ? `rfnd_seed_${orderNumber}` : undefined,
        refundAmount: prepaid ? amount : undefined,
      };
    }

    orders.push(order);
  });

  // cancellation requests still awaiting a decision on two Processing orders,
  // plus one that was rejected — Feature 10 in every state
  const processing = orders.filter((o) => o.sellerStatus === "Processing");
  processing[0].cancellation = { requested: true, reason: "Delivery is taking longer than expected", status: "Requested", requestedAt: new Date(processing[0].createdAt.getTime() + 8 * 60 * 60 * 1000) };
  processing[1].cancellation = { requested: true, reason: "Want to change the delivery address", status: "Requested", requestedAt: new Date(processing[1].createdAt.getTime() + 5 * 60 * 60 * 1000) };
  processing[2].cancellation = { requested: true, reason: "Changed my mind", status: "Rejected", requestedAt: new Date(processing[2].createdAt.getTime() + 4 * 60 * 60 * 1000), resolvedAt: new Date(processing[2].createdAt.getTime() + 26 * 60 * 60 * 1000), resolutionNote: "Order was already being packed; please use a return after delivery" };

  // --- Reviews (only on items the user actually had delivered) --------
  const delivered = orders.filter((o) => o.deliveryStatus === "Delivered");
  let reviewNumber = 0;
  for (const order of delivered) {
    for (const item of order.items) {
      // ~90% of delivered items get a review
      if (rng() < 0.1) continue;
      reviewNumber += 1;
      const [rating, comment] = REVIEW_VOICES[Math.floor(rng() * REVIEW_VOICES.length)];
      reviews.push({
        id: `rev-${reviewNumber}`,
        userId: order.userId,
        userName: order.customerName,
        productId: item.productId,
        productName: item.name,
        orderId: order.id,
        rating,
        comment,
        moderationStatus: reviewNumber % 13 === 0 ? "Pending" : "Approved", // ~9 pending
        createdAt: new Date(order.createdAt.getTime() + 4 * DAY),
      });
    }
  }

  // --- Returns: one request at every stage of the Feature 11 chain ----
  const RETURN_STAGES = [
    ["Requested", []],
    ["Admin Review", ["Requested"]],
    ["Seller Approved", ["Requested", "Admin Review"]],
    ["Pickup Scheduled", ["Requested", "Admin Review", "Seller Approved"]],
    ["Picked Up", ["Requested", "Admin Review", "Seller Approved", "Pickup Scheduled"]],
    ["Under Inspection", ["Requested", "Admin Review", "Seller Approved", "Pickup Scheduled", "Picked Up"]],
    ["Refund Approved", ["Requested", "Admin Review", "Seller Approved", "Pickup Scheduled", "Picked Up", "Under Inspection"]],
    ["Refunded", ["Requested", "Admin Review", "Seller Approved", "Pickup Scheduled", "Picked Up", "Under Inspection", "Refund Approved"]],
  ];
  const RETURN_REASONS = [
    "Size doesn't fit", "Item arrived damaged", "Different from the listing photos",
    "Quality not as expected", "Received the wrong variant", "Missing accessories in the box",
    "Changed my mind after opening", "Defective on arrival",
  ];

  RETURN_STAGES.forEach(([status, history], idx) => {
    const order = delivered[idx];
    const requestedAt = new Date(order.createdAt.getTime() + 6 * DAY);
    const ret = {
      id: `RET-${2001 + idx}`,
      orderId: order.id,
      userId: order.userId,
      customerName: order.customerName,
      items: [{ productId: order.items[0].productId, name: order.items[0].name, qty: order.items[0].qty }],
      reason: RETURN_REASONS[idx],
      photos: [],
      status,
      statusHistory: [...history, status].map((s, hop) => ({ status: s, timestamp: new Date(requestedAt.getTime() + hop * 12 * 60 * 60 * 1000) })),
      pickupPartnerId: ["Pickup Scheduled", "Picked Up", "Under Inspection", "Refund Approved", "Refunded"].includes(status) ? "partner-2" : null,
      pickupPartnerName: ["Pickup Scheduled", "Picked Up", "Under Inspection", "Refund Approved", "Refunded"].includes(status) ? PARTNERS[1][0] : null,
      inspection: ["Refund Approved", "Refunded"].includes(status) ? { result: "Pass", note: "Verified — unused, tags intact" } : { result: null },
      refund: status === "Refunded"
        ? { amount: order.amount, method: order.paymentMethod === "Prepaid" ? "Razorpay (test)" : "COD payout", refundId: `rfnd_ret_${2001 + idx}`, processedAt: new Date(requestedAt.getTime() + 4 * DAY) }
        : { amount: 0 },
      createdAt: requestedAt,
    };
    returns.push(ret);
    if (status === "Refunded") order.sellerStatus = "Returned";
  });

  // --- Notifications so no dashboard opens empty ----------------------
  const now = Date.UTC(2026, 6, 15, 9, 0, 0);
  const notif = (recipientRole, recipientId, type, title, message, payload, hoursAgo) =>
    notifications.push({ recipientRole, recipientId, type, title, message, payload, read: hoursAgo > 24, createdAt: new Date(now - hoursAgo * 60 * 60 * 1000) });

  notif("admin", null, "new-user", "New user registered", "Harpreet Kaur (harpreet.kaur@example.com)", { userId: "user-20" }, 3);
  notif("admin", null, "new-order", `New order ${orders[orders.length - 1].id}`, `${orders[orders.length - 1].customerName} — ₹${orders[orders.length - 1].amount}`, { orderId: orders[orders.length - 1].id }, 5);
  notif("admin", null, "cancellation-requested", `Cancellation requested for ${processing[0].id}`, processing[0].cancellation.reason, { orderId: processing[0].id }, 8);
  notif("admin", null, "return-requested", "Return requested for " + returns[0].orderId, returns[0].reason, { returnId: returns[0].id }, 12);
  notif("admin", null, "review-submitted", "New review pending moderation", "A review is waiting in the moderation queue", {}, 16);
  notif("admin", null, "pickup-requested", "Pickup requested", "A seller has packed an order for dispatch", {}, 20);
  notif("seller", null, "new-order", "New order received", "Check the Orders tab for details", {}, 4);
  notif("seller", null, "pickup-requested", "Pickup confirmed", "A delivery partner has been assigned to your order", {}, 9);
  notif("seller", null, "return-requested", "Return requested on a delivered order", returns[1].reason, { returnId: returns[1].id }, 14);
  notif("seller", null, "cancellation-requested", "Cancellation requested", processing[1].cancellation.reason, { orderId: processing[1].id }, 18);
  notif("delivery", null, "delivery-assigned", "New delivery assigned", "Open your console to accept the assignment", {}, 2);
  notif("delivery", null, "pickup-requested", "Reverse pickup scheduled", "A return pickup is waiting in your queue", { returnId: returns[3].id }, 10);

  // a personal feed for the first few users
  for (let u = 0; u < 6; u++) {
    const order = orders.find((o) => o.userId === `user-${u + 1}` && o.deliveryStatus);
    if (!order) continue;
    notif(null, `user-${u + 1}`, "order-status", `Order ${order.id}: ${order.deliveryStatus}`, "", { orderId: order.id }, 6 + u * 3);
  }
  notif(null, returns[7].userId, "refund-processed", `Refund processed for ${returns[7].orderId}`, `₹${returns[7].refund.amount} via ${returns[7].refund.method}`, { returnId: returns[7].id }, 24);

  return { orders, reviews, returns, notifications };
}

module.exports = { buildWorld };
