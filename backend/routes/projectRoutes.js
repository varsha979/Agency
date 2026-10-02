import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    updateProjectStatus,
    getProjectProgress,
    deleteProject,
} from "../controllers/projectController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    createProject
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getProjects
);

router.get(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getProjectById
);

router.put(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    updateProject
);

router.patch(
    "/:id/status",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    updateProjectStatus
);

router.get(
    "/:id/progress",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getProjectProgress
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteProject
);

export default router;