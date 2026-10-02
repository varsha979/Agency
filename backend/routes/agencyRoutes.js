import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createAgency,
    getAgencyDashboard,
} from "../controllers/agencyController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    roleMiddleware("super_admin"),
    createAgency
);

router.get(
    "/dashboard",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getAgencyDashboard
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getAgencyDashboard
);

export default router;