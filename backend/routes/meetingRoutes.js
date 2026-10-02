import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createMeeting,
    getMeetings,
    getProjectMeetings,
    updateMeeting,
    deleteMeeting,
} from "../controllers/meetingController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    createMeeting
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getMeetings
);

router.get(
    "/project/:projectId",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getProjectMeetings
);

router.put(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    updateMeeting
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteMeeting
);

export default router;