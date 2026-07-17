// Mongoose schema for a Delivery Partner. `id` (e.g. "partner-1") is the
// business key used everywhere in the API/frontends; Mongo's own `_id`/`__v`
// are stripped from JSON responses so the API shape stays unchanged.

const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  vehicle: { type: String, default: "Bike" }, // Bike / Van / Truck
  zone: { type: String, default: "" }, // service city
  status: { type: String, default: "Active" }, // Active / On Delivery / Offline
});

deliveryPartnerSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);

module.exports = { DeliveryPartner };
