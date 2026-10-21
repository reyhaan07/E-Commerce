const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), quiet: true });

const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedDatabase = require("./data/seed");
const { loadCoverage } = require("./utils/coverage");
const { initRealtime } = require("./realtime");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // return-request photos come in as data URLs
// Express 5 leaves req.body undefined when a request has no JSON body, so every
// `const { ... } = req.body` in the routes threw a TypeError and came back as a
// 500 instead of the route's own 400 validation message.
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
});

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const deliveryPartnersRoutes = require("./routes/deliveryPartners");
const usersRoutes = require("./routes/users");
const productsRoutes = require("./routes/products");
const reviewsRoutes = require("./routes/reviews");
const paymentsRoutes = require("./routes/payments");
const notificationsRoutes = require("./routes/notifications");
const returnsRoutes = require("./routes/returns");
const adminRoutes = require("./routes/admin");
const payrollRoutes = require("./routes/payroll");
const supportRoutes = require("./routes/support");
const coverageRoutes = require("./routes/coverage");

app.use("/api", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/delivery-partners", deliveryPartnersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/returns", returnsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/coverage", coverageRoutes);

// Catches errors passed to next(err) (e.g. by asyncHandler) so a Mongoose
// validation/duplicate-key error comes back as normal JSON instead of
// Express's default HTML error page.
app.use((err, req, res, next) => {
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "That value is already in use" });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err.name === "CastError") {
        return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` });
    }
    // body-parser errors (malformed JSON → 400, body over the limit → 413) carry
    // their own client-error status; they used to be reported as a 500.
    if (err.type && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ success: false, message: err.expose ? err.message : "Invalid request" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initRealtime(server);

connectDB()
    .then(seedDatabase)
    // Delivery catchments are admin-editable and cached in memory; seed them
    // from data/pincodes.js on first boot, then warm the cache.
    .then(loadCoverage)
    .then((zones) => {
        console.log(`Delivery coverage loaded: ${zones.length} zones`);
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (HTTP + Socket.io)`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
