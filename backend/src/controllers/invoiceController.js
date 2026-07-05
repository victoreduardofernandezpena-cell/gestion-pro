import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { INVOICE_STATUSES } from "../constants/billing.js";
import { sendDocumentPdf } from "../utils/pdfGenerator.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { getDefaultTaxRate, getDocumentSetting } from "../utils/settings.js";
import { getNextDocumentNumber } from "../utils/numbering.js";
import { getActiveLoyaltySetting, roundMoney } from "../utils/loyaltyCalculator.js";
import { requireCompanyId } from "../utils/companyScope.js";

const invoiceInclude = {
  client: { select: { id: true, name: true, rnc: true, phone: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, code: true, name: true, stock: true } }
    },
    orderBy: { id: "asc" }
  },
  payments: { orderBy: { paymentDate: "desc" } },
  loyaltyTransactions: {
    include: { loyaltyAccount: { select: { id: true, credentialCode: true } } },
    orderBy: { createdAt: "desc" }
  }
};

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
  const loyaltyAccountId = body.loyaltyAccountId ? Number(body.loyaltyAccountId) : null;
  const loyaltyRedeemAmount = Number(body.loyaltyRedeemAmount || 0);

  if (!Number.isInteger(clientId) || clientId <= 0) return { message: "Debe seleccionar un cliente valido" };
  if (items.length === 0) return { message: "Debe agregar al menos un producto" };
  if (Number.isNaN(discount) || discount < 0) return { message: "El descuento no puede ser negativo" };
  if (Number.isNaN(loyaltyRedeemAmount) || loyaltyRedeemAmount < 0) return { message: "El credito de fidelizacion no puede ser negativo" };

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

  return { clientId, items: normalizedItems, discount, loyaltyAccountId, loyaltyRedeemAmount, notes: body.notes?.trim() || null };
};

export const listInvoices = async (req, res, next) => {
  try {
    const status = req.query.status?.toUpperCase();
    if (status && !INVOICE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Estado de factura invalido" });
    }

    const id = req.query.id ? Number(req.query.id) : null;
    const text = req.query.text?.trim();
    const client = req.query.client?.trim();
    const item = req.query.item?.trim();
    const startDate = req.query.startDate ? new Date(`${req.query.startDate}T00:00:00.000Z`) : null;
    const endDate = req.query.endDate ? new Date(`${req.query.endDate}T23:59:59.999Z`) : null;

    if (req.query.id && (!Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ message: "ID de factura invalido" });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: requireCompanyId(req),
        ...(id ? { id } : {}),
        ...(status ? { status } : {}),
        ...(startDate || endDate ? { createdAt: { ...(startDate ? { gte: startDate } : {}), ...(endDate ? { lte: endDate } : {}) } } : {}),
        ...(text
          ? {
            OR: [
              { invoiceNumber: { contains: text, mode: "insensitive" } },
              { notes: { contains: text, mode: "insensitive" } }
            ]
          }
          : {}),
        ...(client
          ? {
            client: {
              OR: [
                { name: { contains: client, mode: "insensitive" } },
                { rnc: { contains: client, mode: "insensitive" } },
                { phone: { contains: client, mode: "insensitive" } }
              ]
            }
          }
          : {}),
        ...(item
          ? {
            items: {
              some: {
                product: {
                  OR: [
                    { name: { contains: item, mode: "insensitive" } },
                    { code: { contains: item, mode: "insensitive" } },
                    { sku: { contains: item, mode: "insensitive" } },
                    { reference: { contains: item, mode: "insensitive" } },
                    { barcode: { contains: item, mode: "insensitive" } }
                  ]
                }
              }
            }
          }
          : {})
      },
      include: {
        client: { select: { id: true, name: true, rnc: true } },
        items: { include: { product: { select: { id: true, code: true, name: true } } } }
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

    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId: requireCompanyId(req) },
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
      const companyId = requireCompanyId(req);
      const client = await tx.client.findFirst({ where: { id: payload.clientId, companyId } });
      if (!client) {
        const error = new Error("Cliente no encontrado");
        error.status = 404;
        throw error;
      }

      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds }, companyId } });
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
      const taxRate = await getDefaultTaxRate(tx, companyId);
      const tax = roundMoney(subtotal * taxRate);
      const discount = roundMoney(payload.discount);
      const loyaltyDiscount = roundMoney(payload.loyaltyRedeemAmount);
      const maxLoyaltyRedeem = roundMoney(Math.max(subtotal - discount, 0));

      if (loyaltyDiscount > 0) {
        if (!payload.loyaltyAccountId) {
          const error = new Error("Debe seleccionar una cuenta de fidelizacion para usar credito");
          error.status = 400;
          throw error;
        }
        const setting = await getActiveLoyaltySetting(tx, companyId);
        if (!setting.allowRedeem) {
          const error = new Error("El canje de fidelizacion esta deshabilitado");
          error.status = 400;
          throw error;
        }
        if (loyaltyDiscount < Number(setting.minimumRedeemAmount)) {
          const error = new Error(`El minimo de canje es ${Number(setting.minimumRedeemAmount)}`);
          error.status = 400;
          throw error;
        }
        const loyaltyAccount = await tx.loyaltyAccount.findFirst({ where: { id: payload.loyaltyAccountId, companyId } });
        if (!loyaltyAccount || !loyaltyAccount.isActive || loyaltyAccount.clientId !== payload.clientId) {
          const error = new Error("Cuenta de fidelizacion invalida para este cliente");
          error.status = 400;
          throw error;
        }
        if (loyaltyDiscount > Number(loyaltyAccount.moneyBalance)) {
          const error = new Error("No se puede usar mas credito de fidelizacion que el balance disponible");
          error.status = 400;
          throw error;
        }
        if (loyaltyDiscount > maxLoyaltyRedeem) {
          const error = new Error("El credito de fidelizacion solo puede aplicarse al monto de productos, no al impuesto");
          error.status = 400;
          throw error;
        }
      }

      const total = roundMoney(subtotal + tax - discount - loyaltyDiscount);

      if (total < 0) {
        const error = new Error("El descuento no puede ser mayor que subtotal e impuestos");
        error.status = 400;
        throw error;
      }

      const documentSettings = await getDocumentSetting(tx, companyId);
      const invoiceNumber = await getNextDocumentNumber(tx, "INVOICE", companyId);
      const createdInvoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          clientId: payload.clientId,
          subtotal,
          tax,
          discount,
          loyaltyDiscount,
          total,
          paidAmount: 0,
          balance: total,
          status: "PENDING",
          notes: payload.notes || documentSettings?.invoiceNotes || null
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
            companyId,
            productId: item.productId,
            type: "SALIDA",
            quantity: item.quantity,
            reason: `Factura #${invoiceNumber}`
          }
        });
      }

      if (loyaltyDiscount > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            companyId,
            loyaltyAccountId: payload.loyaltyAccountId,
            clientId: payload.clientId,
            invoiceId: createdInvoice.id,
            type: "REDEEMED",
            amount: loyaltyDiscount,
            points: loyaltyDiscount,
            description: `Credito usado en factura ${invoiceNumber}`
          }
        });
        await tx.loyaltyAccount.update({
          where: { id: payload.loyaltyAccountId },
          data: {
            moneyBalance: { decrement: loyaltyDiscount },
            pointsBalance: { decrement: loyaltyDiscount },
            totalRedeemed: { increment: loyaltyDiscount }
          }
        });
      }

      return tx.invoice.findFirst({ where: { id: createdInvoice.id, companyId }, include: invoiceInclude });
    }, { isolationLevel: "Serializable" });

    res.status(201).json(invoice);
    await createAuditLog({ action: "INVOICE_CREATED", module: "FACTURACION", entityType: "Invoice", entityId: invoice.id, description: `Factura creada: ${invoice.invoiceNumber}`, req });
    if (Number(invoice.loyaltyDiscount || 0) > 0) {
      await createAuditLog({ action: "LOYALTY_REWARD_REDEEMED", module: "FIDELIZACION", entityType: "Invoice", entityId: invoice.id, description: `Credito de fidelizacion usado en ${invoice.invoiceNumber}`, req });
    }
  } catch (error) {
    next(error);
  }
};

export const duplicateInvoice = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const invoice = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const source = await tx.invoice.findFirst({
        where: { id, companyId },
        include: { items: true, client: { select: { id: true } } }
      });
      if (!source) {
        const error = new Error("Factura origen no encontrada");
        error.status = 404;
        throw error;
      }
      if (source.status === "CANCELLED") {
        const error = new Error("No se puede duplicar una factura anulada");
        error.status = 400;
        throw error;
      }

      const productIds = [...new Set(source.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds }, companyId } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of source.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          const error = new Error("Producto no encontrado al duplicar factura");
          error.status = 404;
          throw error;
        }
        if (product.stock < item.quantity) {
          const error = new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
          error.status = 400;
          throw error;
        }
      }

      const subtotal = roundMoney(source.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0));
      const taxRate = await getDefaultTaxRate(tx, companyId);
      const tax = roundMoney(subtotal * taxRate);
      const discount = roundMoney(Number(source.discount || 0));
      const total = roundMoney(subtotal + tax - discount);
      if (total < 0) {
        const error = new Error("La factura duplicada tendria total negativo");
        error.status = 400;
        throw error;
      }

      const documentSettings = await getDocumentSetting(tx, companyId);
      const invoiceNumber = await getNextDocumentNumber(tx, "INVOICE", companyId);
      const createdInvoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          clientId: source.clientId,
          subtotal,
          tax,
          discount,
          loyaltyDiscount: 0,
          total,
          paidAmount: 0,
          balance: total,
          status: "PENDING",
          notes: source.notes || documentSettings?.invoiceNotes || null
        }
      });

      for (const item of source.items) {
        const product = productMap.get(item.productId);
        await tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            cost: product.cost,
            total: roundMoney(Number(item.quantity) * Number(item.price))
          }
        });
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        await tx.inventoryMovement.create({
          data: { companyId, productId: item.productId, type: "SALIDA", quantity: item.quantity, reason: `Factura duplicada #${invoiceNumber}`, document: invoiceNumber, reference: source.invoiceNumber }
        });
      }

      return tx.invoice.findFirst({ where: { id: createdInvoice.id, companyId }, include: invoiceInclude });
    }, { isolationLevel: "Serializable" });

    res.status(201).json(invoice);
    await createAuditLog({ action: "INVOICE_DUPLICATED", module: "FACTURACION", entityType: "Invoice", entityId: invoice.id, description: `Factura duplicada: ${invoice.invoiceNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const existing = await prisma.invoice.findFirst({ where: { id, companyId: requireCompanyId(req) } });
    if (!existing) return res.status(404).json({ message: "Factura no encontrada" });
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { notes: req.body.notes?.trim() || null },
      include: invoiceInclude
    });

    res.json(invoice);
    await createAuditLog({ action: "INVOICE_UPDATED", module: "FACTURACION", entityType: "Invoice", entityId: invoice.id, description: `Factura actualizada: ${invoice.invoiceNumber}`, req });
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
      const companyId = requireCompanyId(req);
      const existing = await tx.invoice.findFirst({
        where: { id, companyId },
        include: { items: true, payments: true, loyaltyTransactions: true }
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
            companyId,
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Cancelacion Factura #${existing.invoiceNumber}`
          }
        });
      }

      const redeemed = existing.loyaltyTransactions
        .filter((transaction) => transaction.type === "REDEEMED")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      if (redeemed > 0) {
        const transaction = existing.loyaltyTransactions.find((item) => item.type === "REDEEMED");
        await tx.loyaltyAccount.update({
          where: { id: transaction.loyaltyAccountId },
          data: {
            moneyBalance: { increment: redeemed },
            pointsBalance: { increment: redeemed },
            totalRedeemed: { decrement: redeemed }
          }
        });
        await tx.loyaltyTransaction.create({
          data: {
            companyId,
            loyaltyAccountId: transaction.loyaltyAccountId,
            clientId: transaction.clientId,
            invoiceId: existing.id,
            type: "CANCELLED",
            amount: redeemed,
            points: redeemed,
            description: `Reverso de credito por cancelacion de ${existing.invoiceNumber}`
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
    await createAuditLog({ action: "INVOICE_CANCELLED", module: "FACTURACION", entityType: "Invoice", entityId: invoice.id, description: `Factura cancelada: ${invoice.invoiceNumber}`, req });
    if (Number(invoice.loyaltyDiscount || 0) > 0) {
      await createAuditLog({ action: "LOYALTY_REWARD_REVERSED", module: "FIDELIZACION", entityType: "Invoice", entityId: invoice.id, description: `Credito de fidelizacion revertido en ${invoice.invoiceNumber}`, req });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = cancelInvoice;

export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de factura invalido" });

    const companyId = requireCompanyId(req);
    const invoice = await prisma.invoice.findFirst({ where: { id, companyId }, include: invoiceInclude });
    if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });

    const [company, documentSettings] = await Promise.all([prisma.companySetting.findFirst({ where: { companyId } }), prisma.documentSetting.findFirst({ where: { companyId } })]);
    sendDocumentPdf(res, {
      filename: `${invoice.invoiceNumber}.pdf`,
      title: `Factura ${invoice.invoiceNumber}`,
      subtitle: "Documento generado desde Gestion Pro",
      details: {
        Fecha: invoice.createdAt,
        Cliente: invoice.client?.name,
        RNC: invoice.client?.rnc,
        Estado: invoice.status
      },
      company,
      documentSettings,
      columns: [
        { header: "Codigo", value: (item) => item.product?.code },
        { header: "Producto", value: (item) => item.product?.name },
        { header: "Cantidad", value: (item) => item.quantity },
        { header: "Precio", value: (item) => Number(item.price) },
        { header: "Total", value: (item) => Number(item.total) }
      ],
      rows: invoice.items,
      totals: {
        Subtotal: Number(invoice.subtotal),
        Impuesto: Number(invoice.tax),
        Descuento: Number(invoice.discount),
        "Credito fidelidad": Number(invoice.loyaltyDiscount || 0),
        Total: Number(invoice.total),
        Pagado: Number(invoice.paidAmount),
        Balance: Number(invoice.balance)
      },
      notes: invoice.notes || documentSettings?.invoiceNotes,
      terms: documentSettings?.invoiceTerms
    });
  } catch (error) {
    next(error);
  }
};
