import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const selectWarehouse = { id: true, code: true, name: true, address: true, isActive: true, createdAt: true, updatedAt: true };

const normalizeWarehouse = (body) => ({
  code: body.code?.trim(),
  name: body.name?.trim(),
  address: body.address?.trim() || null
});

export const listWarehouses = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId: requireCompanyId(req),
        ...(search
          ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } }
            ]
          }
          : {})
      },
      select: selectWarehouse,
      orderBy: { name: "asc" }
    });
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const data = normalizeWarehouse(req.body);
    if (!data.code || !data.name) return res.status(400).json({ message: "Codigo y nombre del almacen son requeridos" });

    const warehouse = await prisma.warehouse.create({ data: { ...data, companyId: requireCompanyId(req) }, select: selectWarehouse });
    await createAuditLog({ action: "WAREHOUSE_CREATED", module: "INVENTARIO", entityType: "Warehouse", entityId: warehouse.id, description: `Almacen creado: ${warehouse.code}`, req });
    res.status(201).json(warehouse);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un almacen con ese codigo" });
    next(error);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de almacen invalido" });
    const data = normalizeWarehouse(req.body);
    if (!data.code || !data.name) return res.status(400).json({ message: "Codigo y nombre del almacen son requeridos" });

    const existing = await prisma.warehouse.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Almacen no encontrado" });

    const warehouse = await prisma.warehouse.update({ where: { id }, data, select: selectWarehouse });
    await createAuditLog({ action: "WAREHOUSE_UPDATED", module: "INVENTARIO", entityType: "Warehouse", entityId: warehouse.id, description: `Almacen actualizado: ${warehouse.code}`, req });
    res.json(warehouse);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un almacen con ese codigo" });
    next(error);
  }
};

export const updateWarehouseStatus = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de almacen invalido" });
    const existing = await prisma.warehouse.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Almacen no encontrado" });

    const warehouse = await prisma.warehouse.update({ where: { id }, data: { isActive: Boolean(req.body.isActive) }, select: selectWarehouse });
    await createAuditLog({ action: "WAREHOUSE_STATUS_CHANGED", module: "INVENTARIO", entityType: "Warehouse", entityId: warehouse.id, description: `Estado de almacen: ${warehouse.isActive ? "activo" : "inactivo"}`, req });
    res.json(warehouse);
  } catch (error) {
    next(error);
  }
};
