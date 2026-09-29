// A delivery catchment: the set of PIN codes treated as "near" each other.
//
// This used to live only in data/pincodes.js, so widening partner coverage
// meant editing source and restarting. The clusters now live here so an admin
// can manage gate 2 (which partners can serve which warehouse) from the
// console; data/pincodes.js remains the seed used to populate this collection
// the first time, and the fallback if the collection is empty.
//
// Proximity is still an explicit, editable mapping — never inferred from the
// numeric difference between two PIN codes.

const mongoose = require("mongoose");

const pincodeClusterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "zone-1"
  city: { type: String, required: true },
  hub: { type: String, required: true }, // representative PIN for the city
  // PINs in one catchment. Every PIN here is near every other one, and itself.
  near: { type: [String], default: [] },
  // Same city, deliberately outside the catchment. Kept so the
  // "same city but not serviceable" path stays reachable.
  outliers: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

pincodeClusterSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const PincodeCluster = mongoose.model("PincodeCluster", pincodeClusterSchema);

module.exports = { PincodeCluster };
