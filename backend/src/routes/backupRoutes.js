import { Router } from "express";
import { createBackup, deleteBackup, downloadBackup, listBackups, restoreBackup } from "../controllers/backupController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));
router.get("/", asyncHandler(listBackups));
router.post("/create", asyncHandler(createBackup));
router.get("/:filename/download", asyncHandler(downloadBackup));
router.delete("/:filename", asyncHandler(deleteBackup));
router.post("/:filename/restore", asyncHandler(restoreBackup));

export default router;
