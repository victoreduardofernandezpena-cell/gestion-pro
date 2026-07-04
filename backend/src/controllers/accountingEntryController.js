import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { getNextDocumentNumber } from "../utils/numbering.js";
import { requireCompanyId } from "../utils/companyScope.js";

const entryInclude = {
  lines: {
    include: {
      account: { select: { id: true, code: true, name: true, type: true } }
    },
    orderBy: { id: "asc" }
  }
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getNextEntryNumber = async (tx) => {
  const lastEntry = await tx.accountingEntry.findFirst({
    orderBy: { id: "desc" },
    select: { entryNumber: true }
  });
  const lastNumber = lastEntry?.entryNumber?.match(/AST-(\d+)/)?.[1];
  const nextNumber = lastNumber ? Number(lastNumber) + 1 : 1;
  return `AST-${String(nextNumber).padStart(6, "0")}`;
};

const validateEntryPayload = (body) => {
  const date = body.date ? new Date(body.date) : null;
  const description = body.description?.trim();
  const reference = body.reference?.trim() || null;
  const lines = Array.isArray(body.lines) ? body.lines : [];

  if (!date || Number.isNaN(date.getTime())) return { message: "La fecha es obligatoria" };
  if (!description) return { message: "La descripcion es obligatoria" };
  if (lines.length < 2) return { message: "El asiento debe tener al menos 2 lineas" };

  const normalizedLines = [];
  for (const line of lines) {
    const accountId = Number(line.accountId);
    const debit = roundMoney(line.debit || 0);
    const credit = roundMoney(line.credit || 0);

    if (!Number.isInteger(accountId) || accountId <= 0) return { message: "Cada linea debe tener una cuenta contable" };
    if (Number.isNaN(debit) || Number.isNaN(credit)) return { message: "Debito y credito deben ser valores numericos" };
    if (debit < 0 || credit < 0) return { message: "Debito y credito no pueden ser negativos" };
    if (debit > 0 && credit > 0) return { message: "Una linea no puede tener debito y credito al mismo tiempo" };
    if (debit === 0 && credit === 0) return { message: "Cada linea debe tener debito o credito" };

    normalizedLines.push({
      accountId,
      debit,
      credit,
      description: line.description?.trim() || null
    });
  }

  const totalDebit = roundMoney(normalizedLines.reduce((sum, line) => sum + line.debit, 0));
  const totalCredit = roundMoney(normalizedLines.reduce((sum, line) => sum + line.credit, 0));

  if (totalDebit !== totalCredit) return { message: "El asiento no esta cuadrado: debito y credito deben ser iguales" };

  return { date, description, reference, lines: normalizedLines, totalDebit, totalCredit };
};

export const listAccountingEntries = async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = { companyId: requireCompanyId(req), ...(status && status !== "ALL" ? { status } : {}) };

    const entries = await prisma.accountingEntry.findMany({
      where,
      orderBy: { date: "desc" }
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
};

export const getAccountingEntry = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de asiento invalido" });

    const entry = await prisma.accountingEntry.findFirst({ where: { id, companyId: requireCompanyId(req) }, include: entryInclude });
    if (!entry) return res.status(404).json({ message: "Asiento contable no encontrado" });

    res.json(entry);
  } catch (error) {
    next(error);
  }
};

export const createAccountingEntry = async (req, res, next) => {
  try {
    const payload = validateEntryPayload(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });

    const entry = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const accountIds = [...new Set(payload.lines.map((line) => line.accountId))];
      const accounts = await tx.accountingAccount.findMany({ where: { id: { in: accountIds }, companyId } });
      const accountMap = new Map(accounts.map((account) => [account.id, account]));

      for (const line of payload.lines) {
        const account = accountMap.get(line.accountId);
        if (!account || !account.isActive) {
          const error = new Error("Una de las cuentas contables no existe o esta inactiva");
          error.status = 400;
          throw error;
        }
      }

      const entryNumber = await getNextDocumentNumber(tx, "ACCOUNTING_ENTRY", companyId);
      const created = await tx.accountingEntry.create({
        data: {
          companyId,
          entryNumber,
          date: payload.date,
          description: payload.description,
          reference: payload.reference,
          totalDebit: payload.totalDebit,
          totalCredit: payload.totalCredit,
          status: "DRAFT"
        }
      });

      await tx.accountingEntryLine.createMany({
        data: payload.lines.map((line) => ({
          entryId: created.id,
          companyId,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description
        }))
      });

      return tx.accountingEntry.findFirst({ where: { id: created.id, companyId }, include: entryInclude });
    }, { isolationLevel: "Serializable" });

    res.status(201).json(entry);
    await createAuditLog({ action: "ACCOUNTING_ENTRY_CREATED", module: "CONTABILIDAD", entityType: "AccountingEntry", entityId: entry.id, description: `Asiento creado: ${entry.entryNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const postAccountingEntry = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de asiento invalido" });

    const entry = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const existing = await tx.accountingEntry.findFirst({ where: { id, companyId }, include: { lines: true } });
      if (!existing) {
        const error = new Error("Asiento contable no encontrado");
        error.status = 404;
        throw error;
      }
      if (existing.status !== "DRAFT") {
        const error = new Error("Solo los asientos en borrador pueden publicarse");
        error.status = 400;
        throw error;
      }

      const totalDebit = roundMoney(existing.lines.reduce((sum, line) => sum + Number(line.debit), 0));
      const totalCredit = roundMoney(existing.lines.reduce((sum, line) => sum + Number(line.credit), 0));
      if (totalDebit !== totalCredit) {
        const error = new Error("No se puede publicar un asiento descuadrado");
        error.status = 400;
        throw error;
      }

      return tx.accountingEntry.update({
        where: { id },
        data: { status: "POSTED", totalDebit, totalCredit },
        include: entryInclude
      });
    }, { isolationLevel: "Serializable" });

    res.json(entry);
    await createAuditLog({ action: "ACCOUNTING_ENTRY_POSTED", module: "CONTABILIDAD", entityType: "AccountingEntry", entityId: entry.id, description: `Asiento publicado: ${entry.entryNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const cancelAccountingEntry = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de asiento invalido" });

    const existing = await prisma.accountingEntry.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Asiento contable no encontrado" });
    if (!["DRAFT", "POSTED"].includes(existing.status)) {
      return res.status(400).json({ message: "Este asiento no puede cancelarse" });
    }

    const entry = await prisma.accountingEntry.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: entryInclude
    });

    res.json(entry);
    await createAuditLog({ action: "ACCOUNTING_ENTRY_CANCELLED", module: "CONTABILIDAD", entityType: "AccountingEntry", entityId: entry.id, description: `Asiento cancelado: ${entry.entryNumber}`, req });
  } catch (error) {
    next(error);
  }
};
