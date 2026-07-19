// Mongoose schema for a Delivery Partner. `id` (e.g. "partner-1") is the
// business key used everywhere in the API/frontends; Mongo's own `_id`/`__v`
// are stripped from JSON responses so the API shape stays unchanged.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const deliveryPartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  avatar: { type: String, default: "" },
  vehicle: { type: String, default: "Bike" }, // Bike / Van / Truck
  zone: { type: String, default: "" }, // service city
  status: { type: String, default: "Active" }, // Active / On Delivery / Offline
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

module.exports = { DeliveryPartner };
