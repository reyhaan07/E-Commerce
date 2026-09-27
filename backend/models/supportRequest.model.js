// A support request raised from Seller Center ("Contact Support"). Persisted so
// the admin team has a record even if the notification is dismissed, and so the
// seller can see what they already sent.

const mongoose = require("mongoose");

const SUPPORT_CATEGORIES = ["Orders", "Payments", "Products", "Account", "Other"];
const SUPPORT_STATUSES = ["Open", "Resolved"];

const supportRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  // who raised it — denormalised the same way orders snapshot seller details,
  // so an admin reading the queue doesn't need a second lookup
  requesterId: { type: String, required: true },
  requesterRole: { type: String, default: "seller" },
  requesterName: String,
  requesterEmail: String,
  category: { type: String, enum: SUPPORT_CATEGORIES, default: "Other" },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: SUPPORT_STATUSES, default: "Open" },
  createdAt: { type: Date, default: Date.now },
});

supportRequestSchema.index({ requesterId: 1, createdAt: -1 });

supportRequestSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const SupportRequest = mongoose.model("SupportRequest", supportRequestSchema);

module.exports = { SupportRequest, SUPPORT_CATEGORIES, SUPPORT_STATUSES };
