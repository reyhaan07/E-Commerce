require("dotenv").config({ quiet: true });

const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedDatabase = require("./data/seed");
const { initRealtime } = require("./realtime");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" })); // return-request photos come in as data URLs

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
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initRealtime(server);

connectDB()
    .then(seedDatabase)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (HTTP + Socket.io)`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
