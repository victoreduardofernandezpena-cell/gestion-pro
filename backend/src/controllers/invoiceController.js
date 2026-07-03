import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { INVOICE_STATUSES, TAX_RATE } from "../constants/billing.js";

const invoiceInclude = {
  client: { select: { id: true, name: true, rnc: true, phone: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, code: true, name: true, stock: true } }
    },
    orderBy: { id: "asc" }
  },
  payments: { orderBy: { paymentDate: "desc" } }
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getNextInvoiceNumber = async (tx) => {
  const lastInvoice = await tx.invoice.findFirst({
    orderBy: { id: "desc" },
    select: { invoiceNumber: true }
  });

  const lastNumber = lastInvoice?.invoiceNumber?.match(/FAC-(\d+)/)?.[1];
  const nextNumber = lastNumber ? Number(lastNumber) + 1 : 1;
  return `FAC-${String(nextNumber).padStart(6, "0")}`;
};

const validateInvoicePayload = (body) => {
  const clientId = Number(body.clientId);
  const items = Array.isArray(body.items) ? body.items : [];
  const discount = Number(body.discount || 0);

  if (!Number.isInteger(clientId) || clientId <= 0) return { message: "Debe seleccionar un cliente valido" };
  if (items.length === 0) return { message: "Debe agregar al menos un producto" };
  if (Number.isNaN(discount) || discount < 0) return { message: "El descuento no puede ser negativo" };

  const normalizedItems = [];

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!Number.isInteger(productId) || productId <= 0) return { message: "Producto invalido en la factura" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { message: "La cantidad debe ser mayor que cero" };
    if (Number.isNaN(price) || price < 0) return { message: "El precio debe ser mayor o igual a cero" };

    normalizedItems.push({ productId, quantity, price });
  }

  return { clientId, items: normalizedItems, discount, notes: body.notes?.trim() || null };
};

export const listInvoices = async (req, res, next) => {
  try {
    const status = req.query.status?.toUpperCase();
    if (status && !INVOICE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Estado de factura invalido" });
    }

    const invoices = await prisma.invoice.findMany({
      where: status ? { status } : undefined,
      include: {
        client: { select: { id: true, name: true, rnc: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude
    });

    if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const payload = validateInvoicePayload(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });

    const invoice = await prisma.$transaction(async (tx) => {
      const client = await tx.client.findUnique({ where: { id: payload.clientId } });
      if (!client) {
        const error = new Error("Cliente no encontrado");
        error.status = 404;
        throw error;
      }

      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((product) => [product.id, product]));
      const requestedByProduct = payload.items.reduce((acc, item) => {
        acc.set(item.productId, (acc.get(item.productId) || 0) + item.quantity);
        return acc;
      }, new Map());

      for (const [productId, requestedQuantity] of requestedByProduct.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          const error = new Error("Producto no encontrado en la factura");
          error.status = 404;
          throw error;
        }
        if (product.stock < requestedQuantity) {
          const error = new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
          error.status = 400;
          throw error;
        }
      }

      const subtotal = roundMoney(payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0));
      const tax = roundMoney(subtotal * TAX_RATE);
      const discount = roundMoney(payload.discount);
      const total = roundMoney(subtotal + tax - discount);

      if (total < 0) {
        const error = new Error("El descuento no puede ser mayor que subtotal e impuestos");
        error.status = 400;
        throw error;
      }

      const invoiceNumber = await getNextInvoiceNumber(tx);
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: payload.clientId,
          subtotal,
          tax,
          discount,
          total,
          paidAmount: 0,
          balance: total,
          status: "PENDING",
          notes: payload.notes
        }
      });

      for (const item of payload.items) {
        const product = productMap.get(item.productId);
        await tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            cost: product.cost,
            total: roundMoney(item.quantity * item.price)
          }
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "SALIDA",
            quantity: item.quantity,
            reason: `Factura #${invoiceNumber}`
          }
        });
      }

      return tx.invoice.findUnique({ where: { id: createdInvoice.id }, include: invoiceInclude });
    }, { isolationLevel: "Serializable" });

    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { notes: req.body.notes?.trim() || null },
      include: invoiceInclude
    });

    res.json(invoice);
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Factura no encontrada" });
    next(error);
  }
};

export const cancelInvoice = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id },
        include: { items: true, payments: true }
      });

      if (!existing) {
        const error = new Error("Factura no encontrada");
        error.status = 404;
        throw error;
      }
      if (existing.status === "PAID") {
        const error = new Error("No se puede cancelar una factura pagada");
        error.status = 400;
        throw error;
      }
      if (existing.status === "CANCELLED") {
        const error = new Error("La factura ya esta anulada");
        error.status = 400;
        throw error;
      }
      if (existing.payments.length > 0) {
        const error = new Error("No se puede cancelar una factura con pagos registrados");
        error.status = 400;
        throw error;
      }

      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Cancelacion Factura #${existing.invoiceNumber}`
          }
        });
      }

      return tx.invoice.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: invoiceInclude
      });
    }, { isolationLevel: "Serializable" });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = cancelInvoice;
