import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
  createFeedback,
  getFeedback,
  getProjectFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  addFeedbackComment,
  getFeedbackComments,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  createFeedback
);

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  getFeedback
);

router.get(
  "/project/:projectId",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  getProjectFeedback
);

router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  getFeedbackById
);

router.patch(
  "/:id/status",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team"),
  updateFeedbackStatus
);

router.post(
  "/:id/comments",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  addFeedbackComment
);

router.get(
  "/:id/comments",
  authMiddleware,
  tenantMiddleware,
  roleMiddleware("agency_admin", "agency_team", "agency_client"),
  getFeedbackComments
);

export default router;