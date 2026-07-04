import { Router } from "express";
import {
  createAccountingAccount,
  deleteAccountingAccount,
  getAccountingAccount,
  listAccountingAccounts,
  updateAccountingAccount
} from "../controllers/accountingAccountController.js";
import {
  cancelAccountingEntry,
  createAccountingEntry,
  getAccountingEntry,
  listAccountingEntries,
  postAccountingEntry
} from "../controllers/accountingEntryController.js";
import {
  getAccountSummary,
  getIncomeStatement,
  getTrialBalance
} from "../controllers/accountingReportController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("admin", "contabilidad"));

router.get("/accounts", listAccountingAccounts);
router.get("/accounts/:id", getAccountingAccount);
router.post("/accounts", createAccountingAccount);
router.put("/accounts/:id", updateAccountingAccount);
router.delete("/accounts/:id", deleteAccountingAccount);

router.get("/entries", listAccountingEntries);
router.get("/entries/:id", getAccountingEntry);
router.post("/entries", createAccountingEntry);
router.patch("/entries/:id/post", postAccountingEntry);
router.patch("/entries/:id/cancel", cancelAccountingEntry);

router.get("/reports/trial-balance", getTrialBalance);
router.get("/reports/income-statement", getIncomeStatement);
router.get("/reports/account-summary", getAccountSummary);

export default router;
