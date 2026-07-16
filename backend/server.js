require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedDatabase = require("./data/seed");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const deliveryPartnersRoutes = require("./routes/deliveryPartners");
const usersRoutes = require("./routes/users");

app.use("/api", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/delivery-partners", deliveryPartnersRoutes);
app.use("/api/users", usersRoutes);

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

connectDB()
    .then(seedDatabase)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });
