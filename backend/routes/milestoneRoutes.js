import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createMilestone,
    getMilestones,
    updateMilestone,
    updateMilestoneStatus,
    deleteMilestone,
} from "../controllers/milestoneController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    createMilestone
);

router.get(
    "/project/:projectId",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getMilestones
);

router.put(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    updateMilestone
);

router.patch(
    "/:id/status",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    updateMilestoneStatus
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteMilestone
);

export default router;