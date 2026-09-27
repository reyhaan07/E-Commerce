// Mongoose schema for a Delivery Partner. `id` (e.g. "partner-1") is the
// business key used everywhere in the API/frontends; Mongo's own `_id`/`__v`
// are stripped from JSON responses so the API shape stays unchanged.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Account standing (access), as opposed to the operational duty `status`.
const ACCOUNT_STATUSES = ["active", "suspended", "deactivated"];
const REQUEST_STATUSES = ["pending", "approved", "rejected"];

const deliveryPartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  avatar: { type: String, default: "" },
  vehicle: { type: String, default: "Bike" }, // Bike / Van / Truck
  zone: { type: String, default: "" }, // service city
  // Base PIN the partner operates out of (Part B). Used to match a partner to
  // a seller's warehouse PIN via the explicit nearby-PIN mapping. String so
  // leading zeros survive; never compared numerically.
  pincode: { type: String, default: "" },
  status: { type: String, default: "Active" }, // Active / On Delivery / Offline
  // Account standing, kept deliberately separate from the operational `status`
  // above (which is duty state, not access). Defaults to "active" so every
  // partner seeded before this field existed keeps working unchanged.
  // "deactivated" is what an admin "remove" now does - a soft delete, so the
  // partner's app can tell them instead of silently looking live.
  accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: "active" },
  // Set when a suspended partner appeals. Lives on the partner rather than in a
  // new collection - there is only ever one open request per partner.
  unsuspensionRequest: {
    status: { type: String, enum: REQUEST_STATUSES, default: null },
    message: { type: String, default: "" },
    requestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: null }, // admin account id
    reason: { type: String, default: "" },       // admin's note on approve/reject
  },
  // Payroll inputs (Feature 5). Defaults give payroll generation something to
  // work with before an admin tunes them per partner.
  baseSalary: { type: Number, default: 15000 },
  incentivePerDelivery: { type: Number, default: 30 },
});

// Hash the password whenever it's set/changed, so callers pass plain text
// (seed data, admin-created partners) and never touch bcrypt — same contract
// as the Account model.
deliveryPartnerSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

deliveryPartnerSchema.methods.comparePassword = function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.password);
};

deliveryPartnerSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);

module.exports = { DeliveryPartner, ACCOUNT_STATUSES, REQUEST_STATUSES };
