import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const selectBrand = { id: true, name: true, isActive: true, createdAt: true, updatedAt: true };

export const listBrands = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const brands = await prisma.brand.findMany({
      where: {
        companyId: requireCompanyId(req),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {})
      },
      select: selectBrand,
      orderBy: { name: "asc" }
    });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ message: "El nombre de la marca es requerido" });

    const brand = await prisma.brand.create({
      data: { companyId: requireCompanyId(req), name },
      select: selectBrand
    });
    await createAuditLog({ action: "BRAND_CREATED", module: "INVENTARIO", entityType: "Brand", entityId: brand.id, description: `Marca creada: ${brand.name}`, req });
    res.status(201).json(brand);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe una marca con ese nombre" });
    next(error);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const name = req.body.name?.trim();
    if (!id) return res.status(400).json({ message: "ID de marca invalido" });
    if (!name) return res.status(400).json({ message: "El nombre de la marca es requerido" });

    const existing = await prisma.brand.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Marca no encontrada" });

    const brand = await prisma.brand.update({ where: { id }, data: { name }, select: selectBrand });
    await createAuditLog({ action: "BRAND_UPDATED", module: "INVENTARIO", entityType: "Brand", entityId: brand.id, description: `Marca actualizada: ${brand.name}`, req });
    res.json(brand);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe una marca con ese nombre" });
    next(error);
  }
};

export const updateBrandStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de marca invalido" });
    const existing = await prisma.brand.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Marca no encontrada" });

    const brand = await prisma.brand.update({ where: { id }, data: { isActive: Boolean(req.body.isActive) }, select: selectBrand });
    await createAuditLog({ action: "BRAND_STATUS_CHANGED", module: "INVENTARIO", entityType: "Brand", entityId: brand.id, description: `Estado de marca: ${brand.isActive ? "activa" : "inactiva"}`, req });
    res.json(brand);
  } catch (error) {
    next(error);
  }
};
