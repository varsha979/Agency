import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createTeamMember,
    getTeamMembers,
    updateTeamMemberStatus,
    deleteTeamMember,
} from "../controllers/teamController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    createTeamMember
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getTeamMembers
);

router.patch(
    "/:id/status",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    updateTeamMemberStatus
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteTeamMember
);

export default router;