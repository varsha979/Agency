import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    getClientDashboard,
} from "../controllers/clientPortalController.js";

const router = express.Router();

router.get(
    "/dashboard",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_client"),
    getClientDashboard
);

export default router;