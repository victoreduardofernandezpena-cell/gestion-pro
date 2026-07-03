import { Router } from "express";
import {
  cancelPurchase,
  createPurchase,
  createPurchasePayment,
  getPurchase,
  listPurchasePayments,
  listPurchases
} from "../controllers/purchaseController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.get("/", authorizeRoles("admin", "almacen", "contabilidad"), listPurchases);
router.get("/:id", authorizeRoles("admin", "almacen", "contabilidad"), getPurchase);
router.post("/", authorizeRoles("admin", "almacen"), createPurchase);
router.patch("/:id/cancel", authorizeRoles("admin", "almacen"), cancelPurchase);
router.get("/:id/payments", authorizeRoles("admin", "almacen", "contabilidad"), listPurchasePayments);
router.post("/:id/payments", authorizeRoles("admin", "almacen", "contabilidad"), createPurchasePayment);

export default router;
