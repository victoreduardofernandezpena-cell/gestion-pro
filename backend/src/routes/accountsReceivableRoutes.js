import { Router } from "express";
import { getAccountsReceivableSummary, listAccountsReceivable } from "../controllers/accountsReceivableController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "ventas", "contabilidad"), listAccountsReceivable);
router.get("/summary", authorizeRoles("admin", "ventas", "contabilidad"), getAccountsReceivableSummary);

export default router;
