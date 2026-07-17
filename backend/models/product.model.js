// Product catalog. `id` (e.g. "prod-1") is the business key, matching how
// Account/Order/DeliveryPartner already work in this backend.

const mongoose = require("mongoose");

const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sellerId: { type: String, required: true }, // Account.id of the seller
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  brand: { type: String, default: "" },
  // 4-level placement: category → subcategory → productType → product.
  // `category` stays a plain string so every existing filter keeps working.
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  productType: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null },
  discount: { type: Number, default: 0 }, // percent, derived from oldPrice when present
  images: [String],
  specs: [specSchema],
  sku: { type: String, default: "" },
  stock: { type: Number, default: 0, min: 0 },
  approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: "Pending" },
  rating: { type: Number, default: 0 }, // average of approved reviews
  ratingCount: { type: Number, default: 0 },
  // "isNew" is reserved by Mongoose, hence the longer name
  isNewArrival: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

productSchema.index({ name: "text", description: "text", category: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ category: 1, subcategory: 1, productType: 1 });
productSchema.index({ sellerId: 1 });

productSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = { Product, APPROVAL_STATUSES };
