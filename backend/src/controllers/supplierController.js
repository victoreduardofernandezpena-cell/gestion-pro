import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const supplierSelect = {
  id: true,
  name: true,
  rnc: true,
  phone: true,
  email: true,
  address: true,
  createdAt: true,
  updatedAt: true
};

export const listSuppliers = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const companyId = requireCompanyId(req);
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rnc: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          } : {})
      },
      select: supplierSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json(suppliers);
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de proveedor invalido" });

    const supplier = await prisma.supplier.findFirst({ where: { id, companyId: requireCompanyId(req) }, select: supplierSelect });
    if (!supplier) return res.status(404).json({ message: "Proveedor no encontrado" });

    res.json(supplier);
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, rnc, phone, email, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });

    const supplier = await prisma.supplier.create({
      data: { companyId: requireCompanyId(req), name: name.trim(), rnc: rnc || null, phone, email, address },
      select: supplierSelect
    });

    res.status(201).json(supplier);
    await createAuditLog({ action: "SUPPLIER_CREATED", module: "PROVEEDORES", entityType: "Supplier", entityId: supplier.id, description: `Proveedor creado: ${supplier.name}`, req });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un proveedor con ese RNC" });
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de proveedor invalido" });

    const { name, rnc, phone, email, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "El nombre es requerido" });

    const existing = await prisma.supplier.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Proveedor no encontrado" });

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name: name.trim(), rnc: rnc || null, phone, email, address },
      select: supplierSelect
    });

    res.json(supplier);
    await createAuditLog({ action: "SUPPLIER_UPDATED", module: "PROVEEDORES", entityType: "Supplier", entityId: supplier.id, description: `Proveedor actualizado: ${supplier.name}`, req });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Proveedor no encontrado" });
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un proveedor con ese RNC" });
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de proveedor invalido" });

    const companyId = requireCompanyId(req);
    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ message: "Proveedor no encontrado" });
    const purchaseCount = await prisma.purchase.count({ where: { supplierId: id, companyId } });
    if (purchaseCount > 0) {
      return res.status(400).json({ message: "No se puede eliminar un proveedor con compras asociadas" });
    }

    await prisma.supplier.delete({ where: { id } });
    await createAuditLog({ action: "SUPPLIER_DELETED", module: "PROVEEDORES", entityType: "Supplier", entityId: id, description: "Proveedor eliminado", req });
    sendDeleted(res, "Proveedor");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Proveedor no encontrado" });
    next(error);
  }
};
