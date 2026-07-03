import prisma from "../prisma.js";
import { parseIdParam, sendDeleted } from "../utils/http.js";

const productSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
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
    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } }
            ]
          }
        : undefined,
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

    const product = await prisma.product.findUnique({
      where: { id },
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

    const product = await prisma.product.create({ data, select: productSelect });
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

    const product = await prisma.product.update({
      where: { id },
      data,
      select: productSelect
    });

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

    await prisma.product.delete({ where: { id } });
    sendDeleted(res, "Producto");
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Producto no encontrado" });
    next(error);
  }
};
