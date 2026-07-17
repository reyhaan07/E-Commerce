// Drops the shopsphere database and rebuilds the entire demo world from the
// seed modules, so a stale database can never poison a demo.
//   npm run reseed

require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const seedDatabase = require("./seed");

(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  console.log("Dropped database — rebuilding the demo world…");
  await seedDatabase();
  await mongoose.disconnect();
  console.log("Reseed complete.");
  process.exit(0);
})().catch((err) => {
  console.error("Reseed failed:", err);
  process.exit(1);
});
