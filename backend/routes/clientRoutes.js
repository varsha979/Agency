import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";

import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from "../controllers/clientController.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    createClient
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getClients
);

router.get(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team"),
    getClientById
);

router.put(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    updateClient
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteClient
);

export default router;