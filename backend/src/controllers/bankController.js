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

export const listBankAccounts = async (req, res, next) => {
  try {
    const accounts = await findManyMaybePaginated(prisma.bankAccount, { where: { companyId: requireCompanyId(req) }, orderBy: { createdAt: "desc" } }, req.query);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getBankAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const companyId = requireCompanyId(req);
    const includeTransactions = req.query.includeTransactions !== "false";
    const account = await prisma.bankAccount.findFirst({
      where: { id, companyId },
      ...(includeTransactions ? { include: { transactions: { where: { companyId }, orderBy: { transactionDate: "desc" } } } } : {})
    });
    if (!account) return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
    if (!account.transactions) return res.json(account);
    const transactions = await attachFinancialOrigins(account.transactions, { prismaClient: prisma, companyId });
    res.json({ ...account, transactions });
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
        companyId: requireCompanyId(req),
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
    const existing = await prisma.bankAccount.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
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
    const companyId = requireCompanyId(req);
    const existing = await prisma.bankAccount.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Cuenta bancaria no encontrada" });
    const count = await prisma.bankTransaction.count({ where: { bankAccountId: id, companyId } });
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
    const companyId = requireCompanyId(req);
    const accountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : null;
    const type = req.query.type;
    const transactions = await findManyMaybePaginated(prisma.bankTransaction, {
      where: { companyId, ...(Number.isInteger(accountId) && accountId > 0 ? { bankAccountId: accountId } : {}), ...(type ? { type } : {}) },
      include: { bankAccount: { select: { id: true, name: true, bankName: true } } },
      orderBy: { transactionDate: "desc" }
    }, req.query);
    res.json(await attachFinancialOriginsToResult(transactions, { prismaClient: prisma, companyId }));
  } catch (error) {
    next(error);
  }
};

export const listAccountTransactions = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta bancaria invalido" });
    const companyId = requireCompanyId(req);
    const transactions = await findManyMaybePaginated(prisma.bankTransaction, { where: { bankAccountId: id, companyId }, orderBy: { transactionDate: "desc" } }, req.query);
    res.json(await attachFinancialOriginsToResult(transactions, { prismaClient: prisma, companyId }));
  } catch (error) {
    next(error);
  }
};

const createAccountMovement = async ({ req, id, type, amount, description, reference, transactionDate, sourceType = "MANUAL_BANK_MOVEMENT", sourceId = null, sourceNumber = null }) => {
  return prisma.$transaction(async (tx) => {
    const companyId = requireCompanyId(req);
    const account = await tx.bankAccount.findFirst({ where: { id, companyId } });
    if (!account || !account.isActive) {
      const error = new Error("Cuenta bancaria no encontrada o inactiva");
      error.status = 404;
      throw error;
    }
    const nextBalance = calculateMovementBalance(account.currentBalance, amount, type, { increaseTypes: ["DEPOSIT", "TRANSFER_IN"], insufficientMessage: "Balance insuficiente en la cuenta bancaria" });
    const updated = await tx.bankAccount.update({ where: { id }, data: { currentBalance: nextBalance } });
    const transaction = await tx.bankTransaction.create({
      data: { companyId, bankAccountId: id, type, amount, description, reference, sourceType, sourceId, sourceNumber, transactionDate }
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
    const result = await createAccountMovement({ req, id, type: "DEPOSIT", amount, description: req.body.description || "Deposito", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
    await createAuditLog({ action: "BANK_TRANSACTION_CREATED", module: "BANCO", entityType: "BankTransaction", entityId: result.transaction.id, description: `Deposito por ${amount}`, req });
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
    const result = await createAccountMovement({ req, id, type: "WITHDRAWAL", amount, description: req.body.description || "Retiro", reference: req.body.reference || null, transactionDate });
    res.status(201).json(result);
    await createAuditLog({ action: "BANK_TRANSACTION_CREATED", module: "BANCO", entityType: "BankTransaction", entityId: result.transaction.id, description: `Retiro por ${amount}`, req });
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
      const companyId = requireCompanyId(req);
      const [from, to] = await Promise.all([
        tx.bankAccount.findFirst({ where: { id: fromBankAccountId, companyId } }),
        tx.bankAccount.findFirst({ where: { id: toBankAccountId, companyId } })
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
      const fromAccount = await tx.bankAccount.update({ where: { id: fromBankAccountId }, data: { currentBalance: roundMoney(Number(from.currentBalance) - amount) } });
      const toAccount = await tx.bankAccount.update({ where: { id: toBankAccountId }, data: { currentBalance: roundMoney(Number(to.currentBalance) + amount) } });
      const description = req.body.description || `Transferencia a ${to.name}`;
      const reference = req.body.reference || null;
      const outTransaction = await tx.bankTransaction.create({ data: { companyId, bankAccountId: fromBankAccountId, type: "TRANSFER_OUT", amount, description, reference, sourceType: "BANK_TRANSFER", sourceId: toBankAccountId, sourceNumber: to.name, transactionDate } });
      const inTransaction = await tx.bankTransaction.create({ data: { companyId, bankAccountId: toBankAccountId, type: "TRANSFER_IN", amount, description: req.body.description || `Transferencia desde ${from.name}`, reference, sourceType: "BANK_TRANSFER", sourceId: fromBankAccountId, sourceNumber: from.name, transactionDate } });
      return { fromAccount, toAccount, outTransaction, inTransaction };
    }, { isolationLevel: "Serializable" });
    res.status(201).json(result);
    await createAuditLog({ action: "BANK_TRANSACTION_CREATED", module: "BANCO", entityType: "BankTransaction", entityId: result.outTransaction.id, description: `Transferencia bancaria por ${amount}`, req });
  } catch (error) {
    next(error);
  }
};
