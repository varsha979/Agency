import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import tenantMiddleware from "../middleware/tenantMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    uploadFile,
    getFiles,
    downloadFile,
    deleteFile,
} from "../controllers/fileController.js";

const router = express.Router();

router.post(
    "/upload",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    upload.single("file"),
    uploadFile
);

router.get(
    "/",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    getFiles
);

router.get(
    "/:id/download",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin", "agency_team", "agency_client"),
    downloadFile
);

router.delete(
    "/:id",
    authMiddleware,
    tenantMiddleware,
    roleMiddleware("agency_admin"),
    deleteFile
);

export default router;