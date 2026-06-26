const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {

    const { email, password, role } = req.body;

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
        }
    };

    const account = accounts[role];

    if (
        account &&
        account.email === email &&
        account.password === password
    ) {
        return res.json({
            success: true,
            role
        });
    }

    return res.status(401).json({
        success: false,
        message: "Invalid email or password"
    });

});

module.exports = router;
