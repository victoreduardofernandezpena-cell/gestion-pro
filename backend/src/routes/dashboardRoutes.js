import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/summary", authenticate, authorizeRoles("admin", "ventas", "contabilidad"), getDashboardSummary);

export default router;
