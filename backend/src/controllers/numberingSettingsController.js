import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const TYPES = ["INVOICE", "PURCHASE", "ACCOUNTING_ENTRY"];
const validate = (body) => {
  const documentType = body.documentType;
  const prefix = body.prefix?.trim();
  const nextNumber = Number(body.nextNumber);
  const padding = Number(body.padding || 6);
  if (!TYPES.includes(documentType)) return { message: "Tipo de documento invalido" };
  if (!prefix) return { message: "El prefijo es obligatorio" };
  if (!Number.isInteger(nextNumber) || nextNumber < 1) return { message: "El siguiente numero debe ser mayor a cero" };
  if (!Number.isInteger(padding) || padding < 1) return { message: "El padding debe ser mayor a cero" };
  return { documentType, prefix, nextNumber, padding, isActive: body.isActive ?? true };
};

export const listNumbering = async (req, res, next) => {
  try { res.json(await prisma.numberingSetting.findMany({ where: { companyId: requireCompanyId(req) }, orderBy: [{ documentType: "asc" }, { id: "asc" }] })); } catch (error) { next(error); }
};
export const getNumbering = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id ? await prisma.numberingSetting.findFirst({ where: { id, companyId: requireCompanyId(req) } }) : null;
    if (!item) return res.status(404).json({ message: "Numeracion no encontrada" });
    res.json(item);
  } catch (error) { next(error); }
};
export const createNumbering = async (req, res, next) => {
  try {
    const payload = validate(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    const item = await prisma.$transaction(async (tx) => {
      if (payload.isActive) await tx.numberingSetting.updateMany({ where: { companyId, documentType: payload.documentType }, data: { isActive: false } });
      return tx.numberingSetting.upsert({ where: { companyId_documentType: { companyId, documentType: payload.documentType } }, update: payload, create: { ...payload, companyId } });
    });
    await createAuditLog({ action: "NUMBERING_CREATED", module: "CONFIGURACION", entityType: "NumberingSetting", entityId: item.id, description: `Numeracion creada: ${item.documentType}`, req });
    res.status(201).json(item);
  } catch (error) { next(error); }
};
export const updateNumbering = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const payload = validate(req.body);
    if (!id) return res.status(400).json({ message: "ID invalido" });
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    const existing = await prisma.numberingSetting.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Numeracion no encontrada" });
    const item = await prisma.$transaction(async (tx) => {
      if (payload.isActive) await tx.numberingSetting.updateMany({ where: { companyId, documentType: payload.documentType, id: { not: id } }, data: { isActive: false } });
      return tx.numberingSetting.update({ where: { id }, data: payload });
    });
    await createAuditLog({ action: "NUMBERING_UPDATED", module: "CONFIGURACION", entityType: "NumberingSetting", entityId: item.id, description: `Numeracion actualizada: ${item.documentType}`, req });
    res.json(item);
  } catch (error) { next(error); }
};
export const changeNumberingStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = requireCompanyId(req);
    const current = await prisma.numberingSetting.findFirst({ where: { id, companyId } });
    if (!current) return res.status(404).json({ message: "Numeracion no encontrada" });
    const isActive = Boolean(req.body.isActive);
    const item = await prisma.$transaction(async (tx) => {
      if (isActive) await tx.numberingSetting.updateMany({ where: { companyId, documentType: current.documentType, id: { not: id } }, data: { isActive: false } });
      return tx.numberingSetting.update({ where: { id }, data: { isActive } });
    });
    await createAuditLog({ action: "NUMBERING_STATUS_CHANGED", module: "CONFIGURACION", entityType: "NumberingSetting", entityId: item.id, description: `Estado numeracion: ${item.documentType}`, req });
    res.json(item);
  } catch (error) { next(error); }
};
