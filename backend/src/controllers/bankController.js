import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";

const txDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? null : date;
};

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const listBankAccounts = async (req, res, next) => {
  try {
    const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: "desc" } });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getBankAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const account = await prisma.bankAccount.findUnique({
      where: { id },
      include: { transactions: { orderBy: { transactionDate: "desc" } } }
    });
    if (!account) return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const createBankAccount = async (req, res, next) => {
  try {
    const { name, bankName, accountNumber, currency = "DOP" } = req.body;
    const initialBalance = Number(req.body.initialBalance || 0);
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });
    if (!bankName?.trim()) return res.status(400).json({ message: "El banco es requerido" });
    if (Number.isNaN(initialBalance) || initialBalance < 0) return res.status(400).json({ message: "El balance inicial no puede ser negativo" });

    const account = await prisma.bankAccount.create({
      data: {
        name: name.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber || null,
        currency: currency || "DOP",
        initialBalance,
        currentBalance: initialBalance,
        isActive: true
      }
    });
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

export const updateBankAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const { name, bankName, accountNumber, currency, isActive } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });
    if (!bankName?.trim()) return res.status(400).json({ message: "El banco es requerido" });
    const account = await prisma.bankAccount.update({
      where: { id },
      data: { name: name.trim(), bankName: bankName.trim(), accountNumber: accountNumber || null, currency: currency || "DOP", isActive: isActive ?? true }
    });
    res.json(account);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
    next(error);
  }
};

export const deleteBankAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const count = await prisma.bankTransaction.count({ where: { bankAccountId: id } });
    if (count > 0) {
      const account = await prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: "Cuenta bancaria desactivada por tener movimientos asociados", account });
    }
    await prisma.bankAccount.delete({ where: { id } });
    sendDeleted(res, "Cuenta bancaria");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
    next(error);
  }
};

export const listBankTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.bankTransaction.findMany({
      include: { bankAccount: { select: { id: true, name: true, bankName: true } } },
      orderBy: { transactionDate: "desc" }
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const listAccountTransactions = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const transactions = await prisma.bankTransaction.findMany({ where: { bankAccountId: id }, orderBy: { transactionDate: "desc" } });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

const createAccountMovement = async ({ id, type, amount, description, reference, transactionDate }) => {
  return prisma.$transaction(async (tx) => {
    const account = await tx.bankAccount.findUnique({ where: { id } });
    if (!account || !account.isActive) {
      const error = new Error("Cuenta bancaria no encontrada o inactiva");
      error.status = 404;
      throw error;
    }
    const nextBalance = type === "DEPOSIT" ? Number(account.currentBalance) + amount : Number(account.currentBalance) - amount;
    if (nextBalance < 0) {
      const error = new Error("Balance insuficiente en la cuenta bancaria");
      error.status = 400;
      throw error;
    }
    const updated = await tx.bankAccount.update({ where: { id }, data: { currentBalance: money(nextBalance) } });
    const transaction = await tx.bankTransaction.create({
      data: { bankAccountId: id, type, amount, description, reference, transactionDate }
    });
    return { account: updated, transaction };
  }, { isolationLevel: "Serializable" });
};

export const deposit = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const transactionDate = txDate(req.body.transactionDate);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });
    const result = await createAccountMovement({ id, type: "DEPOSIT", amount, description: req.body.description || "Deposito", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const withdraw = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const transactionDate = txDate(req.body.transactionDate);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });
    const result = await createAccountMovement({ id, type: "WITHDRAWAL", amount, description: req.body.description || "Retiro", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const transfer = async (req, res, next) => {
  try {
    const fromBankAccountId = Number(req.body.fromBankAccountId);
    const toBankAccountId = Number(req.body.toBankAccountId);
    const amount = Number(req.body.amount);
    const transactionDate = txDate(req.body.transactionDate);
    if (!Number.isInteger(fromBankAccountId) || !Number.isInteger(toBankAccountId)) return res.status(400).json({ message: "Cuentas origen y destino son requeridas" });
    if (fromBankAccountId === toBankAccountId) return res.status(400).json({ message: "No se puede transferir a la misma cuenta" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!transactionDate) return res.status(400).json({ message: "Fecha invalida" });

    const result = await prisma.$transaction(async (tx) => {
      const [from, to] = await Promise.all([
        tx.bankAccount.findUnique({ where: { id: fromBankAccountId } }),
        tx.bankAccount.findUnique({ where: { id: toBankAccountId } })
      ]);
      if (!from || !to || !from.isActive || !to.isActive) {
        const error = new Error("Cuenta bancaria no encontrada o inactiva");
        error.status = 404;
        throw error;
      }
      if (Number(from.currentBalance) < amount) {
        const error = new Error("Balance insuficiente en la cuenta origen");
        error.status = 400;
        throw error;
      }
      const fromAccount = await tx.bankAccount.update({ where: { id: fromBankAccountId }, data: { currentBalance: money(Number(from.currentBalance) - amount) } });
      const toAccount = await tx.bankAccount.update({ where: { id: toBankAccountId }, data: { currentBalance: money(Number(to.currentBalance) + amount) } });
      const description = req.body.description || `Transferencia a ${to.name}`;
      const reference = req.body.reference || null;
      const outTransaction = await tx.bankTransaction.create({ data: { bankAccountId: fromBankAccountId, type: "TRANSFER_OUT", amount, description, reference, transactionDate } });
      const inTransaction = await tx.bankTransaction.create({ data: { bankAccountId: toBankAccountId, type: "TRANSFER_IN", amount, description: req.body.description || `Transferencia desde ${from.name}`, reference, transactionDate } });
      return { fromAccount, toAccount, outTransaction, inTransaction };
    }, { isolationLevel: "Serializable" });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
