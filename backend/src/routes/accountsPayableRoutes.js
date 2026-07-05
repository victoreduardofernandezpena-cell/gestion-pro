import { Router } from "express";
import { getAccountsPayableSummary, listAccountsPayable } from "../controllers/accountsPayableController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "contabilidad"), listAccountsPayable);
router.get("/summary", authorizeRoles("admin", "contabilidad"), getAccountsPayableSummary);

export default router;
