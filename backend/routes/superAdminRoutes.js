import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getDashboard,
    getAgencies,
    getAgencyDetails,
    updateAgencyStatus,
    getAgencyActivity,
    getPlatformActivities,
    supportAgency
} from "../controllers/superAdminController.js";

const router = express.Router();

router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware("super_admin"),
    getDashboard
);

router.get(
    "/agencies",
    authMiddleware,
    roleMiddleware("super_admin"),
    getAgencies
);

router.get(
    "/agencies/:id",
    authMiddleware,
    roleMiddleware("super_admin"),
    getAgencyDetails
);

router.patch(
    "/agencies/:id/status",
    authMiddleware,
    roleMiddleware("super_admin"),
    updateAgencyStatus
);

router.get(
    "/agencies/:id/activity",
    authMiddleware,
    roleMiddleware("super_admin"),
    getAgencyActivity
);

router.get(
    "/activities",
    authMiddleware,
    roleMiddleware("super_admin"),
    getPlatformActivities
);

router.post(
    "/agencies/:id/support",
    authMiddleware,
    roleMiddleware("super_admin"),
    supportAgency
);

export default router;