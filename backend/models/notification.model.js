// A notification backing every bell icon. Targeted either at a whole role
// (recipientRole: "admin") or a single account (recipientId: "user-1").

const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "new-user",
  "new-order",
  "order-status",
  "delivery-assigned",
  "cancellation-requested",
  "cancellation-updated",
  "return-requested",
  "return-updated",
  "review-submitted",
  "product-submitted",
  "refund-processed",
  "pickup-requested",
  // seller onboarding + payroll (Features 5 & 6)
  "seller-application",
  "seller-approved",
  "seller-rejected",
  "payroll-paid",
];

const notificationSchema = new mongoose.Schema({
  recipientRole: { type: String, enum: ["admin", "seller", "user", "delivery", null], default: null },
  recipientId: { type: String, default: null },
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  title: { type: String, required: true },
  message: String,
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipientRole: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

notificationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Notification, NOTIFICATION_TYPES };
