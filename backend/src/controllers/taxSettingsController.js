import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const validate = (body) => {
  const name = body.name?.trim();
  const rate = Number(body.rate);
  if (!name) return { message: "El nombre es obligatorio" };
  if (Number.isNaN(rate) || rate < 0) return { message: "La tasa debe ser mayor o igual a cero" };
  return { name, rate, description: body.description || null, isDefault: Boolean(body.isDefault) };
};

const ensureUniqueActiveName = async (companyId, name, excludeId) => {
  const existing = await prisma.taxSetting.findFirst({ where: { companyId, name, isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  return !existing;
};

export const listTaxes = async (req, res, next) => {
  try { res.json(await prisma.taxSetting.findMany({ where: { companyId: requireCompanyId(req) }, orderBy: { createdAt: "desc" } })); } catch (error) { next(error); }
};
export const getTax = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const tax = id ? await prisma.taxSetting.findFirst({ where: { id, companyId: requireCompanyId(req) } }) : null;
    if (!tax) return res.status(404).json({ message: "Impuesto no encontrado" });
    res.json(tax);
  } catch (error) { next(error); }
};
export const createTax = async (req, res, next) => {
  try {
    const payload = validate(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    if (!(await ensureUniqueActiveName(companyId, payload.name))) return res.status(409).json({ message: "Ya existe un impuesto activo con ese nombre" });
    const tax = await prisma.$transaction(async (tx) => {
      if (payload.isDefault) await tx.taxSetting.updateMany({ where: { companyId }, data: { isDefault: false } });
      return tx.taxSetting.create({ data: { ...payload, companyId } });
    });
    await createAuditLog({ action: "TAX_CREATED", module: "CONFIGURACION", entityType: "TaxSetting", entityId: tax.id, description: `Impuesto creado: ${tax.name}`, req });
    res.status(201).json(tax);
  } catch (error) { next(error); }
};
export const updateTax = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID invalido" });
    const payload = validate(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    const existing = await prisma.taxSetting.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Impuesto no encontrado" });
    if (!(await ensureUniqueActiveName(companyId, payload.name, id))) return res.status(409).json({ message: "Ya existe un impuesto activo con ese nombre" });
    const tax = await prisma.$transaction(async (tx) => {
      if (payload.isDefault) await tx.taxSetting.updateMany({ where: { companyId, id: { not: id } }, data: { isDefault: false } });
      return tx.taxSetting.update({ where: { id }, data: payload });
    });
    await createAuditLog({ action: "TAX_UPDATED", module: "CONFIGURACION", entityType: "TaxSetting", entityId: tax.id, description: `Impuesto actualizado: ${tax.name}`, req });
    res.json(tax);
  } catch (error) { if (error.code === "P2025") return res.status(404).json({ message: "Impuesto no encontrado" }); next(error); }
};
export const changeTaxStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = requireCompanyId(req);
    const existing = await prisma.taxSetting.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Impuesto no encontrado" });
    const tax = await prisma.taxSetting.update({ where: { id }, data: { isActive: Boolean(req.body.isActive), ...(req.body.isActive ? {} : { isDefault: false }) } });
    await createAuditLog({ action: "TAX_STATUS_CHANGED", module: "CONFIGURACION", entityType: "TaxSetting", entityId: tax.id, description: `Estado impuesto: ${tax.name}`, req });
    res.json(tax);
  } catch (error) { next(error); }
};
export const setDefaultTax = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = requireCompanyId(req);
    const tax = await prisma.$transaction(async (tx) => {
      await tx.taxSetting.updateMany({ where: { companyId }, data: { isDefault: false } });
      return tx.taxSetting.update({ where: { id }, data: { isDefault: true, isActive: true } });
    });
    await createAuditLog({ action: "TAX_DEFAULT_CHANGED", module: "CONFIGURACION", entityType: "TaxSetting", entityId: tax.id, description: `Impuesto default: ${tax.name}`, req });
    res.json(tax);
  } catch (error) { next(error); }
};
export const deleteTax = async (req, res, next) => {
  req.body.isActive = false;
  return changeTaxStatus(req, res, next);
};
