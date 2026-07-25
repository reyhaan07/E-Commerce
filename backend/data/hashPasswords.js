// Non-destructive password migration.
//
// The Account and DeliveryPartner models already bcrypt-hash passwords in a
// pre('save') hook, so freshly seeded/registered rows are always hashed. This
// script is only for *existing* databases that still hold plaintext passwords
// (e.g. delivery partners seeded before hashing was added). Run it once:
//
//     node data/hashPasswords.js        (or: npm run hash-passwords)
//
// It is safe to run repeatedly: the `$not: /^\$2/` guard selects only rows
// whose password isn't already a bcrypt hash (bcrypt hashes start with "$2"),
// so nothing is ever double-hashed. We hash manually and write with updateOne
// to bypass the pre-save hook (which would otherwise hash the value a second
// time). Alternatively, `npm run reseed` rebuilds the whole world hashed.
//
// Left untouched by design:
//   - seed-source plaintext in data/people.js and data/sellers.js (those are
//     hashed at seed time by the models' pre-save hook via .create()),
//   - password-reset tokens (resetToken / resetTokenExpiry).

require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const { Account } = require("../models/account.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");

// rows whose password is NOT already a bcrypt hash
const PLAINTEXT_FILTER = { password: { $not: /^\$2/ } };

async function migrate(Model, label) {
  const rows = await Model.find(PLAINTEXT_FILTER);
  let hashed = 0;
  for (const row of rows) {
    const hash = await bcrypt.hash(row.password, 10);
    // updateOne bypasses the pre-save hook so we don't hash a second time
    await Model.updateOne({ _id: row._id }, { password: hash });
    hashed += 1;
  }
  console.log(`${label}: ${hashed} plaintext password(s) hashed.`);
  return hashed;
}

async function run() {
  await connectDB();
  const accounts = await migrate(Account, "Account");
  const partners = await migrate(DeliveryPartner, "DeliveryPartner");
  console.log(`Done — ${accounts + partners} row(s) migrated. Already-hashed rows were skipped.`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Password migration failed:", err);
    process.exit(1);
  });
