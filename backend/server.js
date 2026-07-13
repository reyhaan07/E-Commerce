require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const seedDatabase = require("./data/seed");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const deliveryPartnersRoutes = require("./routes/deliveryPartners");
const usersRoutes = require("./routes/users");

app.use("/api", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/delivery-partners", deliveryPartnersRoutes);
app.use("/api/users", usersRoutes);

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
