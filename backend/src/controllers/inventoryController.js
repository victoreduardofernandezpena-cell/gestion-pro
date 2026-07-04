import prisma from "../prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";

export const listInventory = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: requireCompanyId(req) },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minimumStock: true,
        cost: true,
        price: true
      },
      orderBy: { name: "asc" }
    });

    res.json(
      products.map((product) => ({
        ...product,
        isLowStock: product.stock <= product.minimumStock
      }))
    );
  } catch (error) {
    next(error);
  }
};

export const listInventoryMovements = async (req, res, next) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: { companyId: requireCompanyId(req) },
      include: {
        product: {
          select: { code: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    res.json(movements);
  } catch (error) {
    next(error);
  }
};

export const createInventoryMovement = async (req, res, next) => {
  try {
    const productId = Number(req.body.productId);
    const type = req.body.type;
    const quantity = Number(req.body.quantity);
    const reason = req.body.reason?.trim() || null;

    if (!Number.isInteger(productId) || productId <= 0 || !["ENTRADA", "SALIDA", "AJUSTE"].includes(type)) {
      return res.status(400).json({ message: "Producto y tipo de movimiento son requeridos" });
    }

    if (!Number.isInteger(quantity) || quantity < 0 || (type !== "AJUSTE" && quantity === 0)) {
      return res.status(400).json({ message: "La cantidad debe ser un entero positivo" });
    }

    if (type === "AJUSTE" && !reason) {
      return res.status(400).json({ message: "La razon es obligatoria para ajustes" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const product = await tx.product.findFirst({ where: { id: productId, companyId } });

      if (!product) {
        const error = new Error("Producto no encontrado");
        error.status = 404;
        throw error;
      }

      const nextStock =
        type === "ENTRADA"
          ? product.stock + quantity
          : type === "SALIDA"
            ? product.stock - quantity
            : quantity;

      if (nextStock < 0) {
        const error = new Error("El movimiento dejaria el stock negativo");
        error.status = 400;
        throw error;
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: nextStock }
      });

      const movement = await tx.inventoryMovement.create({
        data: { companyId, productId, type, quantity, reason },
        include: {
          product: {
            select: { code: true, name: true }
          }
        }
      });

      return { product: updatedProduct, movement };
    }, { isolationLevel: "Serializable" });
    await createAuditLog({ action: "INVENTORY_MOVEMENT_CREATED", module: "INVENTARIO", entityType: "InventoryMovement", entityId: result.movement.id, description: `${type} ${quantity} - ${result.movement.product?.name || ""}`, req });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
