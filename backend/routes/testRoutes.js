import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "You are authenticated",
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            agencyId: req.user.agencyId,
        },
    });
});

router.get(
    "/super-admin",
    authMiddleware,
    roleMiddleware("super_admin"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome Super Admin!",
        });
    }
);

export default router;