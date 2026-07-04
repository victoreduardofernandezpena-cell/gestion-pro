import { Router } from "express";
import { getAuditLog, listAuditLogs } from "../controllers/auditLogController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin"));

router.get("/", listAuditLogs);
router.get("/:id", getAuditLog);

export default router;
