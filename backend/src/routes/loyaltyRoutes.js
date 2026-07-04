import { Router } from "express";
import {
  createAccount,
  createAdjustment,
  findByCredential,
  getAccount,
  getClientAccount,
  getLoyaltySummary,
  listAccountTransactions,
  listAccounts,
  listTransactions,
  redeem,
  regenerateCredential,
  updateAccountStatus
} from "../controllers/loyaltyController.js";
import { getLoyaltySettings, updateLoyaltySettings } from "../controllers/loyaltySettingsController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRoles("admin", "ventas", "contabilidad"), getLoyaltySummary);
router.get("/accounts", authorizeRoles("admin", "ventas", "contabilidad"), listAccounts);
router.post("/accounts", authorizeRoles("admin"), createAccount);
router.get("/transactions", authorizeRoles("admin", "contabilidad"), listTransactions);
router.get("/settings", authorizeRoles("admin", "ventas", "contabilidad"), getLoyaltySettings);
router.put("/settings", authorizeRoles("admin"), updateLoyaltySettings);
router.get("/credential/:credentialCode", authorizeRoles("admin", "ventas", "contabilidad"), findByCredential);
router.get("/client/:clientId", authorizeRoles("admin", "ventas", "contabilidad"), getClientAccount);
router.get("/accounts/:id", authorizeRoles("admin", "ventas", "contabilidad"), getAccount);
router.get("/accounts/:id/transactions", authorizeRoles("admin", "contabilidad"), listAccountTransactions);
router.patch("/accounts/:id/status", authorizeRoles("admin"), updateAccountStatus);
router.post("/accounts/:id/regenerate-credential", authorizeRoles("admin"), regenerateCredential);
router.post("/accounts/:id/adjustment", authorizeRoles("admin"), createAdjustment);
router.post("/accounts/:id/redeem", authorizeRoles("admin", "ventas"), redeem);

export default router;
