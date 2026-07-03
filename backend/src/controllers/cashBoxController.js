import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";

const txDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? null : date;
};
const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const listCashBoxes = async (req, res, next) => {
  try {
    res.json(await prisma.cashBox.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (error) {
    next(error);
  }
};

export const getCashBox = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de caja chica invalido" });
    const cashBox = await prisma.cashBox.findUnique({ where: { id }, include: { transactions: { orderBy: { transactionDate: "desc" } } } });
    if (!cashBox) return res.status(404).json({ message: "Caja chica no encontrada" });
    res.json(cashBox);
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
    const cashBox = await prisma.cashBox.create({ data: { name: name.trim(), description: description || null, initialBalance, currentBalance: initialBalance, isActive: true } });
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
    const count = await prisma.cashTransaction.count({ where: { cashBoxId: id } });
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
    res.json(await prisma.cashTransaction.findMany({ where: { cashBoxId: id }, orderBy: { transactionDate: "desc" } }));
  } catch (error) {
    next(error);
  }
};

const createCashMovement = async ({ id, type, amount, description, reference, transactionDate, nextBalanceOverride }) => {
  return prisma.$transaction(async (tx) => {
    const cashBox = await tx.cashBox.findUnique({ where: { id } });
    if (!cashBox || !cashBox.isActive) {
      const error = new Error("Caja chica no encontrada o inactiva");
      error.status = 404;
      throw error;
    }
    const nextBalance = nextBalanceOverride ?? (type === "CASH_IN" ? Number(cashBox.currentBalance) + amount : Number(cashBox.currentBalance) - amount);
    if (nextBalance < 0) {
      const error = new Error("Balance insuficiente en caja chica");
      error.status = 400;
      throw error;
    }
    const updated = await tx.cashBox.update({ where: { id }, data: { currentBalance: money(nextBalance) } });
    const transaction = await tx.cashTransaction.create({ data: { cashBoxId: id, type, amount, description, reference, transactionDate } });
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
    res.status(201).json(await createCashMovement({ id, type: "CASH_IN", amount, description: req.body.description || "Entrada de caja", reference: req.body.reference || null, transactionDate }));
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
    res.status(201).json(await createCashMovement({ id, type: "CASH_OUT", amount, description: req.body.description || "Salida de caja", reference: req.body.reference || null, transactionDate }));
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
    const current = await prisma.cashBox.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ message: "Caja chica no encontrada" });
    const delta = money(newBalance - Number(current.currentBalance));
    res.status(201).json(await createCashMovement({ id, type: "ADJUSTMENT", amount: Math.abs(delta), description: reason, reference: req.body.reference || null, transactionDate, nextBalanceOverride: newBalance }));
  } catch (error) {
    next(error);
  }
};
