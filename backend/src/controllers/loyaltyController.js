import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { getActiveLoyaltySetting, roundMoney } from "../utils/loyaltyCalculator.js";
import { requireCompanyId } from "../utils/companyScope.js";

const accountInclude = {
  client: { select: { id: true, name: true, rnc: true, phone: true, email: true } },
  transactions: { orderBy: { createdAt: "desc" }, take: 10, include: { invoice: { select: { id: true, invoiceNumber: true } } } }
};

const buildCredentialCode = async (tx, companyId) => {
  const accounts = await tx.loyaltyAccount.findMany({ where: { companyId }, select: { credentialCode: true } });
  const max = accounts.reduce((current, account) => {
    const match = account.credentialCode?.match(/^LF-(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `LF-${String(max + 1).padStart(6, "0")}`;
};

export const getLoyaltySummary = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const [totalAccounts, activeAccounts, totals] = await Promise.all([
      prisma.loyaltyAccount.count({ where: { companyId } }),
      prisma.loyaltyAccount.count({ where: { companyId, isActive: true } }),
      prisma.loyaltyAccount.aggregate({
        where: { companyId },
        _sum: { moneyBalance: true, totalEarned: true, totalRedeemed: true }
      })
    ]);
    res.json({
      totalAccounts,
      activeAccounts,
      pendingBalance: Number(totals._sum.moneyBalance || 0),
      totalEarned: Number(totals._sum.totalEarned || 0),
      totalRedeemed: Number(totals._sum.totalRedeemed || 0)
    });
  } catch (error) {
    next(error);
  }
};

export const listAccounts = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const companyId = requireCompanyId(req);
    const accounts = await prisma.loyaltyAccount.findMany({
      where: {
        companyId,
        ...(search ? {
            OR: [
              { credentialCode: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
              { client: { rnc: { contains: search, mode: "insensitive" } } }
            ]
          } : {})
      },
      include: { client: { select: { id: true, name: true, rnc: true, phone: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    const account = await prisma.loyaltyAccount.findFirst({ where: { id, companyId: requireCompanyId(req) }, include: accountInclude });
    if (!account) return res.status(404).json({ message: "Cuenta de fidelizacion no encontrada" });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const getClientAccount = async (req, res, next) => {
  try {
    const clientId = parseIdParam(req.params.clientId);
    if (!clientId) return res.status(400).json({ message: "ID de cliente invalido" });
    const companyId = requireCompanyId(req);
    const account = await prisma.loyaltyAccount.findUnique({ where: { companyId_clientId: { companyId, clientId } }, include: accountInclude });
    if (!account) return res.status(404).json({ message: "Este cliente no tiene cuenta de fidelizacion" });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req, res, next) => {
  try {
    const clientId = Number(req.body.clientId);
    if (!Number.isInteger(clientId) || clientId <= 0) return res.status(400).json({ message: "Debe seleccionar un cliente valido" });

    const account = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const client = await tx.client.findFirst({ where: { id: clientId, companyId } });
      if (!client) {
        const error = new Error("Cliente no encontrado");
        error.status = 404;
        throw error;
      }
      const existing = await tx.loyaltyAccount.findUnique({ where: { companyId_clientId: { companyId, clientId } } });
      if (existing) {
        const error = new Error("Este cliente ya tiene una cuenta de fidelizacion");
        error.status = 400;
        throw error;
      }
      const credentialCode = await buildCredentialCode(tx, companyId);
      return tx.loyaltyAccount.create({
        data: {
          companyId,
          clientId,
          credentialCode,
          qrCodeValue: credentialCode,
          barcodeValue: credentialCode
        },
        include: accountInclude
      });
    });

    await createAuditLog({ action: "LOYALTY_ACCOUNT_CREATED", module: "FIDELIZACION", entityType: "LoyaltyAccount", entityId: account.id, description: `Cuenta creada: ${account.credentialCode}`, req });
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
};

export const updateAccountStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    const isActive = Boolean(req.body.isActive);
    const existing = await prisma.loyaltyAccount.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Cuenta de fidelizacion no encontrada" });
    const account = await prisma.loyaltyAccount.update({ where: { id }, data: { isActive }, include: accountInclude });
    await createAuditLog({ action: "LOYALTY_ACCOUNT_STATUS_CHANGED", module: "FIDELIZACION", entityType: "LoyaltyAccount", entityId: id, description: `Estado cambiado a ${isActive ? "activo" : "inactivo"}`, req });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const regenerateCredential = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    const account = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const existing = await tx.loyaltyAccount.findFirst({ where: { id, companyId } });
      if (!existing) {
        const error = new Error("Cuenta de fidelizacion no encontrada");
        error.status = 404;
        throw error;
      }
      const credentialCode = await buildCredentialCode(tx, companyId);
      return tx.loyaltyAccount.update({
        where: { id },
        data: { credentialCode, qrCodeValue: credentialCode, barcodeValue: credentialCode },
        include: accountInclude
      });
    });
    await createAuditLog({ action: "LOYALTY_CREDENTIAL_REGENERATED", module: "FIDELIZACION", entityType: "LoyaltyAccount", entityId: id, description: `Nueva credencial: ${account.credentialCode}`, req });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const findByCredential = async (req, res, next) => {
  try {
    const credentialCode = req.params.credentialCode?.trim().toUpperCase();
    const account = await prisma.loyaltyAccount.findUnique({ where: { companyId_credentialCode: { companyId: requireCompanyId(req), credentialCode } }, include: accountInclude });
    if (!account) return res.status(404).json({ message: "Credencial de fidelizacion no encontrada" });
    if (!account.isActive) return res.status(400).json({ message: "La cuenta de fidelizacion esta inactiva" });
    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const listTransactions = async (req, res, next) => {
  try {
    const type = req.query.type;
    const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
    const where = {
      companyId: requireCompanyId(req),
      ...(type ? { type } : {}),
      ...(clientId ? { clientId } : {})
    };
    const transactions = await prisma.loyaltyTransaction.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, rnc: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        loyaltyAccount: { select: { id: true, credentialCode: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const listAccountTransactions = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { loyaltyAccountId: id, companyId: requireCompanyId(req) },
      include: { invoice: { select: { id: true, invoiceNumber: true } }, client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const createAdjustment = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const description = req.body.description?.trim() || "Ajuste manual";
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    if (Number.isNaN(amount) || amount === 0) return res.status(400).json({ message: "El ajuste debe ser distinto de cero" });

    const result = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const account = await tx.loyaltyAccount.findFirst({ where: { id, companyId } });
      if (!account) {
        const error = new Error("Cuenta de fidelizacion no encontrada");
        error.status = 404;
        throw error;
      }
      const nextBalance = roundMoney(Number(account.moneyBalance) + amount);
      if (nextBalance < 0) {
        const error = new Error("El ajuste no puede dejar balance negativo");
        error.status = 400;
        throw error;
      }
      const transaction = await tx.loyaltyTransaction.create({
        data: { companyId, loyaltyAccountId: id, clientId: account.clientId, type: "ADJUSTMENT", amount, points: amount, description }
      });
      const updated = await tx.loyaltyAccount.update({ where: { id }, data: { moneyBalance: nextBalance, pointsBalance: nextBalance }, include: accountInclude });
      return { transaction, account: updated };
    });

    await createAuditLog({ action: "LOYALTY_ADJUSTMENT_CREATED", module: "FIDELIZACION", entityType: "LoyaltyAccount", entityId: id, description, req });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const redeem = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto a canjear debe ser mayor que cero" });

    const result = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const setting = await getActiveLoyaltySetting(tx, companyId);
      if (!setting.allowRedeem) {
        const error = new Error("El canje de fidelizacion esta deshabilitado");
        error.status = 400;
        throw error;
      }
      if (amount < Number(setting.minimumRedeemAmount)) {
        const error = new Error(`El minimo de canje es ${Number(setting.minimumRedeemAmount)}`);
        error.status = 400;
        throw error;
      }
      const account = await tx.loyaltyAccount.findFirst({ where: { id, companyId } });
      if (!account || !account.isActive) {
        const error = new Error("Cuenta de fidelizacion no encontrada o inactiva");
        error.status = 404;
        throw error;
      }
      if (amount > Number(account.moneyBalance)) {
        const error = new Error("No se puede canjear mas credito del balance disponible");
        error.status = 400;
        throw error;
      }
      const transaction = await tx.loyaltyTransaction.create({
        data: { companyId, loyaltyAccountId: id, clientId: account.clientId, type: "REDEEMED", amount, points: amount, description: "Canje manual de fidelizacion" }
      });
      const updated = await tx.loyaltyAccount.update({
        where: { id },
        data: {
          moneyBalance: { decrement: amount },
          pointsBalance: { decrement: amount },
          totalRedeemed: { increment: amount }
        },
        include: accountInclude
      });
      return { transaction, account: updated };
    });
    await createAuditLog({ action: "LOYALTY_REWARD_REDEEMED", module: "FIDELIZACION", entityType: "LoyaltyAccount", entityId: id, description: `Canje manual por ${amount}`, req });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
