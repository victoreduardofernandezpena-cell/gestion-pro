import prisma from "../prisma.js";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_SOURCES } from "../constants/finance.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const dateValue = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const includeExpense = {
  bankAccount: { select: { id: true, name: true, bankName: true } },
  cashBox: { select: { id: true, name: true } }
};

export const listExpenses = async (req, res, next) => {
  try {
    const { category, paymentSource, date } = req.query;
    const where = { companyId: requireCompanyId(req) };
    if (category && EXPENSE_CATEGORIES.includes(category)) where.category = category;
    if (paymentSource && EXPENSE_PAYMENT_SOURCES.includes(paymentSource)) where.paymentSource = paymentSource;
    if (date) {
      const start = new Date(date);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        where.expenseDate = { gte: start, lt: end };
      }
    }
    res.json(await prisma.expense.findMany({ where, include: includeExpense, orderBy: { expenseDate: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de gasto invalido" });
    const expense = await prisma.expense.findFirst({ where: { id, companyId: requireCompanyId(req) }, include: includeExpense });
    if (!expense) return res.status(404).json({ message: "Gasto no encontrado" });
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const category = req.body.category;
    const description = req.body.description?.trim();
    const amount = Number(req.body.amount);
    const paymentSource = req.body.paymentSource;
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : null;
    const cashBoxId = req.body.cashBoxId ? Number(req.body.cashBoxId) : null;
    const expenseDate = dateValue(req.body.expenseDate);
    if (!EXPENSE_CATEGORIES.includes(category)) return res.status(400).json({ message: "Categoria invalida" });
    if (!description) return res.status(400).json({ message: "La descripcion es obligatoria" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!EXPENSE_PAYMENT_SOURCES.includes(paymentSource)) return res.status(400).json({ message: "Fuente de pago invalida" });
    if (!expenseDate) return res.status(400).json({ message: "Fecha de gasto invalida" });

    const expense = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      if (paymentSource === "BANK") {
        if (!bankAccountId) {
          const error = new Error("Debe seleccionar una cuenta bancaria");
          error.status = 400;
          throw error;
        }
        const account = await tx.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
        if (!account || !account.isActive) {
          const error = new Error("Cuenta bancaria no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(account.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en la cuenta bancaria");
          error.status = 400;
          throw error;
        }
        await tx.bankAccount.update({ where: { id: bankAccountId }, data: { currentBalance: money(Number(account.currentBalance) - amount) } });
        await tx.bankTransaction.create({ data: { companyId, bankAccountId, type: "WITHDRAWAL", amount, description: `Gasto: ${description}`, reference: req.body.reference || null, transactionDate: expenseDate } });
      }
      if (paymentSource === "CASH_BOX") {
        if (!cashBoxId) {
          const error = new Error("Debe seleccionar una caja chica");
          error.status = 400;
          throw error;
        }
        const cashBox = await tx.cashBox.findFirst({ where: { id: cashBoxId, companyId } });
        if (!cashBox || !cashBox.isActive) {
          const error = new Error("Caja chica no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(cashBox.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en caja chica");
          error.status = 400;
          throw error;
        }
        await tx.cashBox.update({ where: { id: cashBoxId }, data: { currentBalance: money(Number(cashBox.currentBalance) - amount) } });
        await tx.cashTransaction.create({ data: { companyId, cashBoxId, type: "CASH_OUT", amount, description: `Gasto: ${description}`, reference: req.body.reference || null, transactionDate: expenseDate } });
      }
      return tx.expense.create({
        data: { companyId, category, description, amount, paymentSource, bankAccountId: paymentSource === "BANK" ? bankAccountId : null, cashBoxId: paymentSource === "CASH_BOX" ? cashBoxId : null, reference: req.body.reference || null, expenseDate },
        include: includeExpense
      });
    }, { isolationLevel: "Serializable" });
    res.status(201).json(expense);
    await createAuditLog({ action: "EXPENSE_CREATED", module: "GASTOS", entityType: "Expense", entityId: expense.id, description: `Gasto creado: ${description}`, req });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de gasto invalido" });
    const { category, description, reference } = req.body;
    if (!EXPENSE_CATEGORIES.includes(category)) return res.status(400).json({ message: "Categoria invalida" });
    if (!description?.trim()) return res.status(400).json({ message: "La descripcion es obligatoria" });
    const existing = await prisma.expense.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Gasto no encontrado" });
    const expense = await prisma.expense.update({ where: { id }, data: { category, description: description.trim(), reference: reference || null }, include: includeExpense });
    res.json(expense);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Gasto no encontrado" });
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    return res.status(400).json({ message: "No se permite eliminar gastos para no descuadrar balances. Registra un ajuste si necesitas corregirlo." });
  } catch (error) {
    next(error);
  }
};

export const getExpenseSummary = async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({ where: { companyId: requireCompanyId(req) }, select: { amount: true, category: true, expenseDate: true } });
    const summary = expenses.reduce(
      (acc, expense) => {
        const amount = Number(expense.amount);
        const month = expense.expenseDate.toISOString().slice(0, 7);
        acc.totalExpenses += amount;
        acc.countExpenses += 1;
        acc.expensesByCategory[expense.category] = (acc.expensesByCategory[expense.category] || 0) + amount;
        acc.expensesByMonth[month] = (acc.expensesByMonth[month] || 0) + amount;
        return acc;
      },
      { totalExpenses: 0, expensesByCategory: {}, expensesByMonth: {}, countExpenses: 0 }
    );
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
