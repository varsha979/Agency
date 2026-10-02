import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";
import {
    generateProjectSummary,
    draftClientUpdate,
    generateMeetingSummary,
} from "../controllers/aiController.js";

const router = express.Router();

// 1. AI Project Health & Risk Analysis
router.get(
    "/projects/:projectId/summary",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware(
        "super_admin",
        "agency_admin",
        "agency_team",
        "agency_client"
    ),
    generateProjectSummary
);

// 2. AI Client Progress Update Drafter
router.post(
    "/projects/:projectId/client-update",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    draftClientUpdate
);

router.get(
    "/projects/:projectId/client-update",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    draftClientUpdate
);

// 3. AI Meeting Summary to Action Items
router.post(
    "/meetings/:meetingId/summary",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    generateMeetingSummary
);

router.post(
    "/meetings/summarize",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    generateMeetingSummary
);

export default router;