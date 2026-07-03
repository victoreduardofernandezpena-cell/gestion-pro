import { Router } from "express";
import { getAccountsPayableSummary, listAccountsPayable } from "../controllers/accountsPayableController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "almacen", "contabilidad"), listAccountsPayable);
router.get("/summary", authorizeRoles("admin", "almacen", "contabilidad"), getAccountsPayableSummary);

export default router;
