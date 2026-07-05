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
        sku: true,
        reference: true,
        category: true,
        brand: true,
        brandRef: { select: { id: true, name: true } },
        stock: true,
        minimumStock: true,
        cost: true,
        price: true,
        requiresLot: true,
        requiresSerial: true,
        requiresExpiration: true
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

export const getInventoryAlerts = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const today = new Date();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);

    const [products, expiringMovements, expiredMovements] = await Promise.all([
      prisma.product.findMany({
        where: { companyId },
        select: {
          id: true,
          code: true,
          name: true,
          stock: true,
          minimumStock: true,
          cost: true,
          brand: true,
          brandRef: { select: { name: true } },
          category: true
        },
        orderBy: { name: "asc" }
      }),
      prisma.inventoryMovement.findMany({
        where: {
          companyId,
          expirationDate: { gte: today, lte: soon }
        },
        include: {
          product: { select: { code: true, name: true } },
          warehouse: { select: { code: true, name: true } }
        },
        orderBy: { expirationDate: "asc" },
        take: 25
      }),
      prisma.inventoryMovement.findMany({
        where: {
          companyId,
          expirationDate: { lt: today }
        },
        include: {
          product: { select: { code: true, name: true } },
          warehouse: { select: { code: true, name: true } }
        },
        orderBy: { expirationDate: "desc" },
        take: 25
      })
    ]);

    const lowStock = products.filter((product) => product.stock > 0 && product.stock <= product.minimumStock);
    const outOfStock = products.filter((product) => product.stock <= 0);
    const withoutCost = products.filter((product) => Number(product.cost || 0) <= 0);
    const withoutBrand = products.filter((product) => !product.brandRef?.name && !product.brand);

    res.json({
      summary: {
        totalProducts: products.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        withoutCost: withoutCost.length,
        withoutBrand: withoutBrand.length,
        expiringSoon: expiringMovements.length,
        expired: expiredMovements.length
      },
      lowStock,
      outOfStock,
      withoutCost,
      withoutBrand,
      expiringSoon: expiringMovements,
      expired: expiredMovements
    });
  } catch (error) {
    next(error);
  }
};

export const listInventoryMovements = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const product = req.query.product?.trim();
    const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
    const type = req.query.type;
    const reference = req.query.reference?.trim();
    const startDate = req.query.startDate ? new Date(`${req.query.startDate}T00:00:00.000Z`) : null;
    const endDate = req.query.endDate ? new Date(`${req.query.endDate}T23:59:59.999Z`) : null;
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        companyId,
        ...(warehouseId ? { warehouseId } : {}),
        ...(type ? { type } : {}),
        ...(reference ? { reference: { contains: reference, mode: "insensitive" } } : {}),
        ...(startDate || endDate ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
        ...(product
          ? {
            product: {
              OR: [
                { name: { contains: product, mode: "insensitive" } },
                { code: { contains: product, mode: "insensitive" } },
                { sku: { contains: product, mode: "insensitive" } },
                { reference: { contains: product, mode: "insensitive" } }
              ]
            }
          }
          : {})
      },
      include: {
        product: {
          select: { code: true, name: true, sku: true, reference: true }
        },
        warehouse: { select: { id: true, code: true, name: true } }
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
    const warehouseId = req.body.warehouseId ? Number(req.body.warehouseId) : null;
    const cost = req.body.cost !== undefined && req.body.cost !== "" ? Number(req.body.cost) : null;
    const reference = req.body.reference?.trim() || null;
    const document = req.body.document?.trim() || null;
    const note = req.body.note?.trim() || null;
    const lotNumber = req.body.lotNumber?.trim() || null;
    const serialNumber = req.body.serialNumber?.trim() || null;
    const expirationDate = req.body.expirationDate ? new Date(req.body.expirationDate) : null;
    const reason = req.body.reason?.trim() || null;

    if (!Number.isInteger(productId) || productId <= 0 || !["ENTRADA", "SALIDA", "AJUSTE"].includes(type)) {
      return res.status(400).json({ message: "Producto y tipo de movimiento son requeridos" });
    }

    if (!Number.isInteger(quantity) || quantity < 0 || (type !== "AJUSTE" && quantity === 0)) {
      return res.status(400).json({ message: "La cantidad debe ser un entero positivo" });
    }
    if (warehouseId && (!Number.isInteger(warehouseId) || warehouseId <= 0)) return res.status(400).json({ message: "Almacen invalido" });
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) return res.status(400).json({ message: "El costo debe ser valido" });
    if (expirationDate && Number.isNaN(expirationDate.getTime())) return res.status(400).json({ message: "Fecha de expiracion invalida" });

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
      if (warehouseId) {
        const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, companyId, isActive: true } });
        if (!warehouse) {
          const error = new Error("Almacen no encontrado o inactivo");
          error.status = 404;
          throw error;
        }
      }
      if (product.requiresLot && !lotNumber) {
        const error = new Error("Este producto requiere lote");
        error.status = 400;
        throw error;
      }
      if (product.requiresSerial && !serialNumber) {
        const error = new Error("Este producto requiere serie");
        error.status = 400;
        throw error;
      }
      if (product.requiresExpiration && !expirationDate) {
        const error = new Error("Este producto requiere fecha de expiracion");
        error.status = 400;
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
        data: { companyId, productId, warehouseId, type, quantity, cost, reference, document, note, lotNumber, serialNumber, expirationDate, reason },
        include: {
          product: {
            select: { code: true, name: true }
          },
          warehouse: { select: { id: true, code: true, name: true } }
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
