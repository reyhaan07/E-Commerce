const express = require("express");
const router = express.Router();
const { store } = require("../data/store");

// Hardcoded demo accounts for the 3 original roles, plus one demo Delivery
// Partner account. Real delivery partners created by Admin (Phase 2) are
// checked separately below, against store.deliveryPartners.
// NOTE: no bcrypt/JWT here on purpose — passwords are plaintext and the
// response is just a flat {success, role, id, name}, matching the rest of
// this beginner-friendly project. jsonwebtoken/bcryptjs stay as reserved,
// unused dependencies for a future real-auth pass.
const accounts = {
    admin: {
        email: "admin@shopsphere.com",
        password: "admin123"
    },
    seller: {
        email: "seller@shopsphere.com",
        password: "seller123"
    },
    user: {
        email: "user@shopsphere.com",
        password: "user123"
    },
    delivery: {
        email: "delivery@shopsphere.com",
        password: "delivery123"
    }
};

router.post("/login", (req, res) => {

    const { email, password, role } = req.body;

    const account = accounts[role];

    if (
        account &&
        account.email === email &&
        account.password === password
    ) {
        return res.json({
            success: true,
            role,
            id: `${role}-demo`,
            name: role.charAt(0).toUpperCase() + role.slice(1)
        });
    }

    // Delivery partners created via Admin aren't in the hardcoded `accounts`
    // map above, so also check the real delivery-partner store.
    if (role === "delivery") {
        const partner = store.deliveryPartners.find(
            (p) => p.email === email && p.password === password
        );
        if (partner) {
            return res.json({
                success: true,
                role: "delivery",
                id: partner.id,
                name: partner.name
            });
        }
    }

    return res.status(401).json({
        success: false,
        message: "Invalid email or password"
    });

});

module.exports = router;
