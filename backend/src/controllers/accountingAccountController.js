import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { requireCompanyId } from "../utils/companyScope.js";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const accountSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { lines: true } }
};

const normalizeAccountPayload = (body, { requireCode = true } = {}) => {
  const code = body.code?.trim();
  const name = body.name?.trim();
  const type = body.type;

  if (requireCode && !code) return { message: "El codigo es obligatorio" };
  if (!name) return { message: "El nombre es obligatorio" };
  if (!ACCOUNT_TYPES.includes(type)) return { message: "Tipo de cuenta invalido" };

  return { code, name, type };
};

export const listAccountingAccounts = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const companyId = requireCompanyId(req);
    const where = {
      companyId,
      ...(search ? {
          OR: [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } }
          ]
        } : {})
    };

    const accounts = await prisma.accountingAccount.findMany({
      where,
      select: accountSelect,
      orderBy: { code: "asc" }
    });

    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

export const getAccountingAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });

    const account = await prisma.accountingAccount.findFirst({ where: { id, companyId: requireCompanyId(req) }, select: accountSelect });
    if (!account) return res.status(404).json({ message: "Cuenta contable no encontrada" });

    res.json(account);
  } catch (error) {
    next(error);
  }
};

export const createAccountingAccount = async (req, res, next) => {
  try {
    const payload = normalizeAccountPayload(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });

    const account = await prisma.accountingAccount.create({
      data: {
        companyId: requireCompanyId(req),
        code: payload.code,
        name: payload.name,
        type: payload.type,
        isActive: true
      },
      select: accountSelect
    });

    res.status(201).json(account);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe una cuenta con ese codigo" });
    next(error);
  }
};

export const updateAccountingAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });

    const payload = normalizeAccountPayload(req.body, { requireCode: false });
    if (payload.message) return res.status(400).json({ message: payload.message });

    const existing = await prisma.accountingAccount.findFirst({
      where: { id, companyId: requireCompanyId(req) },
      include: { _count: { select: { lines: true } } }
    });
    if (!existing) return res.status(404).json({ message: "Cuenta contable no encontrada" });

    const data = { name: payload.name, type: payload.type, isActive: req.body.isActive ?? existing.isActive };
    if (payload.code && payload.code !== existing.code) {
      if (existing._count.lines > 0) {
        return res.status(400).json({ message: "No se puede cambiar el codigo de una cuenta con movimientos" });
      }
      data.code = payload.code;
    }

    const account = await prisma.accountingAccount.update({
      where: { id },
      data,
      select: accountSelect
    });

    res.json(account);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe una cuenta con ese codigo" });
    next(error);
  }
};

export const deleteAccountingAccount = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de cuenta invalido" });

    const companyId = requireCompanyId(req);
    const existing = await prisma.accountingAccount.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Cuenta contable no encontrada" });
    const lines = await prisma.accountingEntryLine.count({ where: { accountId: id, companyId } });
    if (lines > 0) {
      const account = await prisma.accountingAccount.update({
        where: { id },
        data: { isActive: false },
        select: accountSelect
      });
      return res.json({ message: "Cuenta desactivada por tener movimientos asociados", account });
    }

    await prisma.accountingAccount.delete({ where: { id } });
    sendDeleted(res, "Cuenta contable");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Cuenta contable no encontrada" });
    next(error);
  }
};
