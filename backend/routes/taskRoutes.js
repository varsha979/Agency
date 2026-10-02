import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createTask,
    getProjectTasks,
    getMyTasks,
    updateTask,
    updateTaskStatus,
    deleteTask,
} from "../controllers/taskController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    createTask
);

router.get(
    "/project/:projectId",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getProjectTasks
);

router.get(
    "/my-tasks",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getMyTasks
);

router.put(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    updateTask
);

router.patch(
    "/:id/status",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    updateTaskStatus
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteTask
);

export default router;