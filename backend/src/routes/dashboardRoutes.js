import { Router } from "express";
import { getAdvancedDashboard, getDashboardSummary } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/summary", authenticate, authorizeRoles("admin", "ventas", "contabilidad"), getDashboardSummary);
router.get("/advanced", authenticate, authorizeRoles("admin", "ventas", "contabilidad", "almacen"), getAdvancedDashboard);

export default router;
