const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");
const deliveryPartnersRoutes = require("./routes/deliveryPartners");

app.use("/api", authRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/delivery-partners", deliveryPartnersRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});