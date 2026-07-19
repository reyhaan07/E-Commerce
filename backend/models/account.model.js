const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "seller", "user", "delivery"];
const ACCOUNT_STATUSES = ["active", "suspended", "deleted"];


const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String,  required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const paymentMethodSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["card", "upi"], required: true },
    label: String,
    last4: String, // for cards, just the last 4 digits, never the full number
    upiId: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: String,
    price: Number,
    image: String,
    qty: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

// there's no product catalog collection in this backend, so wishlist entries
// keep a small snapshot of the product instead of just an id
const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: String,
    price: Number,
    image: String,
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// seller onboarding documents (Feature 6). Uploads arrive as data URLs, same
// as return-request photos, and server.js already accepts a 10mb JSON body.
const SELLER_DOC_TYPES = ["gst", "pan", "cheque", "id"];
const sellerDocumentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: SELLER_DOC_TYPES, required: true },
    label: String,
    fileName: String,
    dataUrl: { type: String, required: true }, // data: URL or http(s) URL
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ROLES, required: true },
  phone: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  status: { type: String, enum: ACCOUNT_STATUSES, default: "active" },
  emailVerified: { type: Boolean, default: false },
  addresses: [addressSchema],
  paymentMethods: [paymentMethodSchema],
  cart: [cartItemSchema],
  wishlist: [wishlistItemSchema],
  reviews: [reviewSchema],
  deliveryInstructions: String,
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  // registration email verification (Feature 1)
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  // seller-only: aggregate rating across approved reviews of their products
  sellerRating: { type: Number, default: 0 },
  sellerRatingCount: { type: Number, default: 0 },
  // seller-only: store identity shown on product pages / seller verification
  storeDescription: { type: String, default: "" },
  supportEmail: { type: String, default: "" },
  supportPhone: { type: String, default: "" },
  gstin: { type: String, default: "" }, // demo-format registration id
  panNumber: { type: String, default: "" }, // seller PAN (Feature 6)
  businessName: { type: String, default: "" }, // legal/business name
  businessAddress: { type: String, default: "" },
  documents: { type: [sellerDocumentSchema], default: [] }, // uploaded proofs
  verificationStatus: { type: String, enum: ["Pending", "Verified", "Suspended", null], default: null },
  verificationReason: { type: String, default: "" }, // admin note on reject/suspend
  // admin-only: role within the operations org, for the admin roster
  jobTitle: { type: String, default: "" },
  notifyByEmail: { type: Boolean, default: true },
  notifyBySms: { type: Boolean, default: false },
  loyaltyPoints: { type: Number, default: 0 },
});

// hash the password whenever it's set/changed, so callers can just pass
// plain text (register, seed data, password reset) and never touch bcrypt
accountSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

accountSchema.methods.comparePassword = function comparePassword(plainText) {
  return bcrypt.compare(plainText, this.password);
};

accountSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.resetToken;
    delete ret.resetTokenExpiry;
    delete ret.otpCode;
    delete ret.otpExpiry;
    return ret;
  },
});

const Account = mongoose.model("Account", accountSchema);

module.exports = { Account, ROLES, ACCOUNT_STATUSES, SELLER_DOC_TYPES };
