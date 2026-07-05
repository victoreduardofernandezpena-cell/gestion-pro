import { Router } from "express";
import {
  cancelPurchase,
  createPurchase,
  createPurchasePayment,
  downloadPurchasePdf,
  getPurchase,
  listPurchasePayments,
  listPurchases
} from "../controllers/purchaseController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "contabilidad"), listPurchases);
router.get("/:id/pdf", authorizeRoles("admin", "contabilidad"), downloadPurchasePdf);
router.get("/:id", authorizeRoles("admin", "contabilidad"), getPurchase);
router.post("/", authorizeRoles("admin", "contabilidad"), createPurchase);
router.patch("/:id/cancel", authorizeRoles("admin", "contabilidad"), cancelPurchase);
router.get("/:id/payments", authorizeRoles("admin", "contabilidad"), listPurchasePayments);
router.post("/:id/payments", authorizeRoles("admin", "contabilidad"), createPurchasePayment);

export default router;
