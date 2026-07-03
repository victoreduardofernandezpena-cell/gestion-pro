import { Router } from "express";
import {
  createBankAccount,
  deleteBankAccount,
  deposit,
  getBankAccount,
  listAccountTransactions,
  listBankAccounts,
  listBankTransactions,
  transfer,
  updateBankAccount,
  withdraw
} from "../controllers/bankController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("admin", "contabilidad"));

router.get("/accounts", listBankAccounts);
router.get("/accounts/:id", getBankAccount);
router.post("/accounts", createBankAccount);
router.put("/accounts/:id", updateBankAccount);
router.delete("/accounts/:id", deleteBankAccount);
router.get("/transactions", listBankTransactions);
router.get("/accounts/:id/transactions", listAccountTransactions);
router.post("/accounts/:id/deposit", deposit);
router.post("/accounts/:id/withdraw", withdraw);
router.post("/transfer", transfer);

export default router;
