import { Router } from "express";
import { createExpense, deleteExpense, getExpense, getExpenseSummary, listExpenses, updateExpense } from "../controllers/expenseController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("admin", "contabilidad"));

router.get("/", listExpenses);
router.get("/summary", getExpenseSummary);
router.get("/:id", getExpense);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
