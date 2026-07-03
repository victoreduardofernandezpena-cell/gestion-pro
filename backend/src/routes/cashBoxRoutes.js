import { Router } from "express";
import {
  adjustment,
  cashIn,
  cashOut,
  createCashBox,
  deleteCashBox,
  getCashBox,
  listCashBoxes,
  listCashTransactions,
  updateCashBox
} from "../controllers/cashBoxController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("admin", "contabilidad"));

router.get("/", listCashBoxes);
router.get("/:id", getCashBox);
router.post("/", createCashBox);
router.put("/:id", updateCashBox);
router.delete("/:id", deleteCashBox);
router.get("/:id/transactions", listCashTransactions);
router.post("/:id/cash-in", cashIn);
router.post("/:id/cash-out", cashOut);
router.post("/:id/adjustment", adjustment);

export default router;
