// Atomic id sequences.
//
// Every id in this backend used to be minted by scanning the collection for the
// highest existing number and adding one. Under concurrent requests two callers
// read the same maximum and both try to insert it, so one of them dies on the
// unique index — which surfaced to the customer as a raw
// "That value is already in use" at checkout. A single $inc on a counter
// document is atomic in MongoDB, so no two callers can ever receive the
// same number.
//
// The counter seeds itself from the highest id already present, so it drops
// straight into a seeded database without a migration.

const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g. "order"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Highest numeric suffix currently in `collection` for ids shaped `<prefix>N`.
async function currentMax(model, prefix, floor = 0) {
  const rows = await model.find({}, "id").lean();
  return rows.reduce((max, row) => {
    const num = parseInt(String(row.id).replace(prefix, ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, floor);
}

// Returns the next number for `name`, seeding the counter from existing data the
// first time it's used. $setOnInsert makes the seeding safe even if two callers
// race on it — only one insert wins and the other reads the same document.
async function nextSequence(name, model, prefix, floor = 0) {
  const existing = await Counter.findById(name).lean();
  if (!existing) {
    const start = await currentMax(model, prefix, floor);
    await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: start } }, { upsert: true });
  }
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// Convenience wrapper: "order" + Order + "ORD-" -> "ORD-1091"
async function nextId(name, model, prefix, floor = 0) {
  return `${prefix}${await nextSequence(name, model, prefix, floor)}`;
}

module.exports = { Counter, nextSequence, nextId };
