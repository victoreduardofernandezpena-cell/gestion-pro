import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";
import { findManyMaybePaginated } from "../utils/pagination.js";
import { calculateMovementBalance, roundMoney } from "../utils/financialRules.js";
import { attachFinancialOrigins, attachFinancialOriginsToResult } from "../utils/financialTraceability.js";

const txDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? null : date;
};

export const listCashBoxes = async (req, res, next) => {
  try {
    res.json(await findManyMaybePaginated(prisma.cashBox, { where: { companyId: requireCompanyId(req) }, orderBy: { createdAt: "desc" } }, req.query));
  } catch (error) {
    next(error);
  }
};

export const getCashBox = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    const companyId = requireCompanyId(req);
    const includeTransactions = req.query.includeTransactions !== "false";
    const cashBox = await prisma.cashBox.findFirst({
      where: { id, companyId },
      ...(includeTransactions ? { include: { transactions: { where: { companyId }, orderBy: { transactionDate: "desc" } } } } : {})
    });
    if (!cashBox) return res.status(404).json({ message: "Caja chica no encontrada" });
    if (!cashBox.transactions) return res.json(cashBox);
    const transactions = await attachFinancialOrigins(cashBox.transactions, { prismaClient: prisma, companyId });
    res.json({ ...cashBox, transactions });
  } catch (error) {
    next(error);
  }
};

export const createCashBox = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const initialBalance = Number(req.body.initialBalance || 0);
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });
    if (Number.isNaN(initialBalance) || initialBalance < 0) return res.status(400).json({ message: "El balance inicial no puede ser negativo" });
    const cashBox = await prisma.cashBox.create({ data: { companyId: requireCompanyId(req), name: name.trim(), description: description || null, initialBalance, currentBalance: initialBalance, isActive: true } });
    res.status(201).json(cashBox);
  } catch (error) {
    next(error);
  }
};

export const updateCashBox = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    const { name, description, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });
    const existing = await prisma.cashBox.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Caja chica no encontrada" });
    const cashBox = await prisma.cashBox.update({ where: { id }, data: { name: name.trim(), description: description || null, isActive: isActive ?? true } });
    res.json(cashBox);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Caja chica no encontrada" });
    next(error);
  }
};

export const deleteCashBox = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    const companyId = requireCompanyId(req);
    const existing = await prisma.cashBox.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Caja chica no encontrada" });
    const count = await prisma.cashTransaction.count({ where: { cashBoxId: id, companyId } });
    if (count > 0) {
      const cashBox = await prisma.cashBox.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: "Caja chica desactivada por tener movimientos asociados", cashBox });
    }
    await prisma.cashBox.delete({ where: { id } });
    sendDeleted(res, "Caja chica");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Caja chica no encontrada" });
    next(error);
  }
};

export const listCashTransactions = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    const companyId = requireCompanyId(req);
    const transactions = await findManyMaybePaginated(prisma.cashTransaction, { where: { cashBoxId: id, companyId }, orderBy: { transactionDate: "desc" } }, req.query);
    res.json(await attachFinancialOriginsToResult(transactions, { prismaClient: prisma, companyId }));
  } catch (error) {
    next(error);
  }
};

const createCashMovement = async ({ req, id, type, amount, description, reference, transactionDate, nextBalanceOverride, sourceType = "MANUAL_CASH_MOVEMENT", sourceId = null, sourceNumber = null }) => {
  return prisma.$transaction(async (tx) => {
    const companyId = requireCompanyId(req);
    const cashBox = await tx.cashBox.findFirst({ where: { id, companyId } });
    if (!cashBox || !cashBox.isActive) {
      const error = new Error("Caja chica no encontrada o inactiva");
      error.status = 404;
      throw error;
    }
    const nextBalance = nextBalanceOverride ?? calculateMovementBalance(cashBox.currentBalance, amount, type, { increaseTypes: ["CASH_IN"], insufficientMessage: "Balance insuficiente en caja chica" });
    const updated = await tx.cashBox.update({ where: { id }, data: { currentBalance: roundMoney(nextBalance) } });
    const transaction = await tx.cashTransaction.create({ data: { companyId, cashBoxId: id, type, amount, description, reference, sourceType, sourceId, sourceNumber, transactionDate } });
    return { cashBox: updated, transaction };
  }, { isolationLevel: "Serializable" });
};

export const cashIn = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const transactionDate = txDate(req.body.transactionDate);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });
    const result = await createCashMovement({ req, id, type: "CASH_IN", amount, description: req.body.description || "Entrada de caja", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
    await createAuditLog({ action: "CASH_TRANSACTION_CREATED", module: "CAJA_CHICA", entityType: "CashTransaction", entityId: result.transaction.id, description: `Entrada de caja por ${amount}`, req });
  } catch (error) {
    next(error);
  }
};

export const cashOut = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const transactionDate = txDate(req.body.transactionDate);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });
    const result = await createCashMovement({ req, id, type: "CASH_OUT", amount, description: req.body.description || "Salida de caja", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
    await createAuditLog({ action: "CASH_TRANSACTION_CREATED", module: "CAJA_CHICA", entityType: "CashTransaction", entityId: result.transaction.id, description: `Salida de caja por ${amount}`, req });
  } catch (error) {
    next(error);
  }
};

export const adjustment = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const newBalance = Number(req.body.newBalance);
    const reason = req.body.reason?.trim();
    const transactionDate = txDate(req.body.transactionDate);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    if (!reason) return res.status(400).json({ message: "La razon es obligatoria para ajustes" });
    if (Number.isNaN(newBalance) || newBalance < 0) return res.status(400).json({ message: "El nuevo balance no puede ser negativo" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });
    const current = await prisma.cashBox.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!current) return res.status(404).json({ message: "Caja chica no encontrada" });
    const delta = roundMoney(newBalance - Number(current.currentBalance));
    const result = await createCashMovement({ req, id, type: "ADJUSTMENT", amount: Math.abs(delta), description: reason, reference: req.body.reference || null, transactionDate, nextBalanceOverride: newBalance });
    res.status(201).json(result);
    await createAuditLog({ action: "CASH_TRANSACTION_CREATED", module: "CAJA_CHICA", entityType: "CashTransaction", entityId: result.transaction.id, description: `Ajuste de caja: ${reason}`, req });
  } catch (error) {
    next(error);
  }
};
