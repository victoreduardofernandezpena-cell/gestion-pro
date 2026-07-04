import { Router } from "express";
import {
  getFinanceAlerts,
  getFinanceCashFlow,
  getFinanceDebts,
  getFinanceMonthly,
  getFinanceProfitability,
  getFinanceProjections,
  getFinanceSummary
} from "../controllers/financeController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("admin", "contabilidad"));

router.get("/summary", getFinanceSummary);
router.get("/cash-flow", getFinanceCashFlow);
router.get("/profitability", getFinanceProfitability);
router.get("/debts", getFinanceDebts);
router.get("/monthly", getFinanceMonthly);
router.get("/alerts", getFinanceAlerts);
router.get("/projections", getFinanceProjections);

export default router;
