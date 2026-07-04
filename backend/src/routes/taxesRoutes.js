import { Router } from "express";
import {
  getItbis,
  getTaxAlerts,
  getTaxExpenses,
  getTaxMonthly,
  getTaxPurchases,
  getTaxReport,
  getTaxSales,
  getTaxSummary
} from "../controllers/taxesController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin", "contabilidad"));

router.get("/summary", getTaxSummary);
router.get("/itbis", getItbis);
router.get("/sales", getTaxSales);
router.get("/purchases", getTaxPurchases);
router.get("/expenses", getTaxExpenses);
router.get("/monthly", getTaxMonthly);
router.get("/report", getTaxReport);
router.get("/alerts", getTaxAlerts);

export default router;
