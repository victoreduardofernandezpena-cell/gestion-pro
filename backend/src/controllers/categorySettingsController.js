import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const TYPES = ["EXPENSE", "PRODUCT", "CLIENT", "SUPPLIER", "PAYMENT", "OTHER"];
const validate = (body) => {
  const type = body.type;
  const name = body.name?.trim();
  if (!TYPES.includes(type)) return { message: "Tipo invalido" };
  if (!name) return { message: "El nombre es obligatorio" };
  return { type, name, description: body.description || null };
};
const duplicateActive = (companyId, type, name, excludeId) => prisma.systemCategory.findFirst({ where: { companyId, type, name, isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });

export const listCategories = async (req, res, next) => {
  try { res.json(await prisma.systemCategory.findMany({ where: { companyId: requireCompanyId(req), ...(req.query.type ? { type: req.query.type } : {}) }, orderBy: [{ type: "asc" }, { name: "asc" }] })); } catch (error) { next(error); }
};
export const getCategory = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const item = id ? await prisma.systemCategory.findFirst({ where: { id, companyId: requireCompanyId(req) } }) : null;
    if (!item) return res.status(404).json({ message: "Categoria no encontrada" });
    res.json(item);
  } catch (error) { next(error); }
};
export const createCategory = async (req, res, next) => {
  try {
    const payload = validate(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    if (await duplicateActive(companyId, payload.type, payload.name)) return res.status(409).json({ message: "Ya existe una categoria activa con ese nombre y tipo" });
    const item = await prisma.systemCategory.create({ data: { ...payload, companyId, isActive: true } });
    await createAuditLog({ action: "CATEGORY_CREATED", module: "CONFIGURACION", entityType: "SystemCategory", entityId: item.id, description: `Categoria creada: ${item.type}/${item.name}`, req });
    res.status(201).json(item);
  } catch (error) { next(error); }
};
export const updateCategory = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const payload = validate(req.body);
    if (!id) return res.status(400).json({ message: "ID invalido" });
    if (payload.message) return res.status(400).json({ message: payload.message });
    const companyId = requireCompanyId(req);
    const existing = await prisma.systemCategory.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Categoria no encontrada" });
    if (await duplicateActive(companyId, payload.type, payload.name, id)) return res.status(409).json({ message: "Ya existe una categoria activa con ese nombre y tipo" });
    const item = await prisma.systemCategory.update({ where: { id }, data: payload });
    await createAuditLog({ action: "CATEGORY_UPDATED", module: "CONFIGURACION", entityType: "SystemCategory", entityId: item.id, description: `Categoria actualizada: ${item.type}/${item.name}`, req });
    res.json(item);
  } catch (error) { next(error); }
};
export const changeCategoryStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const companyId = requireCompanyId(req);
    const existing = await prisma.systemCategory.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Categoria no encontrada" });
    const item = await prisma.systemCategory.update({ where: { id }, data: { isActive: Boolean(req.body.isActive) } });
    await createAuditLog({ action: "CATEGORY_STATUS_CHANGED", module: "CONFIGURACION", entityType: "SystemCategory", entityId: item.id, description: `Estado categoria: ${item.type}/${item.name}`, req });
    res.json(item);
  } catch (error) { next(error); }
};
export const deleteCategory = async (req, res, next) => {
  req.body.isActive = false;
  return changeCategoryStatus(req, res, next);
};
