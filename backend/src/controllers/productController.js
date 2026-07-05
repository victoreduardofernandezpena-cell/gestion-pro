import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

const productSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  itemType: true,
  status: true,
  barcode: true,
  sku: true,
  category: true,
  subcategory: true,
  family: true,
  brand: true,
  unit: true,
  imageName: true,
  cost: true,
  price: true,
  stock: true,
  minimumStock: true,
  createdAt: true,
  updatedAt: true
};

const normalizeProduct = (body) => ({
  code: body.code?.trim(),
  name: body.name?.trim(),
  description: body.description || null,
  itemType: body.itemType?.trim() || null,
  status: body.status?.trim() || null,
  barcode: body.barcode?.trim() || null,
  sku: body.sku?.trim() || null,
  category: body.category?.trim() || null,
  subcategory: body.subcategory?.trim() || null,
  family: body.family?.trim() || null,
  brand: body.brand?.trim() || null,
  unit: body.unit?.trim() || null,
  imageName: body.imageName?.trim() || null,
  cost: Number(body.cost),
  price: Number(body.price),
  stock: Number(body.stock || 0),
  minimumStock: Number(body.minimumStock || 0)
});

const validateProduct = (data) => {
  if (!data.code || !data.name) return "Codigo y nombre son requeridos";
  if (Number.isNaN(data.cost) || data.cost < 0) return "El costo debe ser valido";
  if (Number.isNaN(data.price) || data.price < 0) return "El precio debe ser valido";
  if (!Number.isInteger(data.stock) || data.stock < 0) return "El stock debe ser un entero positivo";
  if (!Number.isInteger(data.minimumStock) || data.minimumStock < 0) return "El stock minimo debe ser un entero positivo";
  return null;
};

export const listProducts = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const companyId = requireCompanyId(req);
    const products = await prisma.product.findMany({
      where: {
        companyId,
        ...(search
          ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } }
            ]
          }
          : {})
      },
      select: productSelect,
      orderBy: { createdAt: "desc" }
    });

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de producto invalido" });

    const product = await prisma.product.findFirst({
      where: { id, companyId: requireCompanyId(req) },
      select: productSelect
    });

    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = normalizeProduct(req.body);
    const validationError = validateProduct(data);

    if (validationError) return res.status(400).json({ message: validationError });

    const product = await prisma.product.create({ data: { ...data, companyId: requireCompanyId(req) }, select: productSelect });
    await createAuditLog({ action: "PRODUCT_CREATED", module: "PRODUCTOS", entityType: "Product", entityId: product.id, description: `Producto creado: ${product.code}`, req });
    res.status(201).json(product);
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un producto con ese codigo" });
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de producto invalido" });

    const data = normalizeProduct(req.body);
    const validationError = validateProduct(data);

    if (validationError) return res.status(400).json({ message: validationError });

    const existing = await prisma.product.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    const product = await prisma.product.update({
      where: { id },
      data,
      select: productSelect
    });
    await createAuditLog({ action: "PRODUCT_UPDATED", module: "PRODUCTOS", entityType: "Product", entityId: product.id, description: `Producto actualizado: ${product.code}`, req });

    res.json(product);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Producto no encontrado" });
    if (error.code === "P2002") return res.status(409).json({ message: "Ya existe un producto con ese codigo" });
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de producto invalido" });

    const existing = await prisma.product.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Producto no encontrado" });

    await prisma.product.delete({ where: { id } });
    await createAuditLog({ action: "PRODUCT_DELETED", module: "PRODUCTOS", entityType: "Product", entityId: id, description: "Producto eliminado", req });
    sendDeleted(res, "Producto");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Producto no encontrado" });
    next(error);
  }
};
