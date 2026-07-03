import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";

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
    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rnc: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        : undefined,
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

    const supplier = await prisma.supplier.findUnique({ where: { id }, select: supplierSelect });
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
      data: { name: name.trim(), rnc: rnc || null, phone, email, address },
      select: supplierSelect
    });

    res.status(201).json(supplier);
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

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name: name.trim(), rnc: rnc || null, phone, email, address },
      select: supplierSelect
    });

    res.json(supplier);
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

    const purchaseCount = await prisma.purchase.count({ where: { supplierId: id } });
    if (purchaseCount > 0) {
      return res.status(400).json({ message: "No se puede eliminar un proveedor con compras asociadas" });
    }

    await prisma.supplier.delete({ where: { id } });
    sendDeleted(res, "Proveedor");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Proveedor no encontrado" });
    next(error);
  }
};
