import prisma from "../prisma.js";
import { PAYMENT_METHODS } from "../constants/billing.js";
import { parseIdParam } from "../utils/http.js";
import { sendDocumentPdf } from "../utils/pdfGenerator.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { getDefaultTaxRate, getDocumentSetting } from "../utils/settings.js";
import { getNextDocumentNumber } from "../utils/numbering.js";
import { requireCompanyId } from "../utils/companyScope.js";

const purchaseInclude = {
  supplier: { select: { id: true, name: true, rnc: true, phone: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, code: true, name: true, stock: true } }
    },
    orderBy: { id: "asc" }
  },
  payments: {
    include: {
      bankAccount: { select: { id: true, name: true, bankName: true, accountNumber: true, currentBalance: true } },
      bankTransaction: { select: { id: true, type: true, amount: true, description: true, reference: true } }
    },
    orderBy: { paymentDate: "desc" }
  }
};

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getNextPurchaseNumber = async (tx) => {
  const lastPurchase = await tx.purchase.findFirst({
    orderBy: { id: "desc" },
    select: { purchaseNumber: true }
  });
  const lastNumber = lastPurchase?.purchaseNumber?.match(/COM-(\d+)/)?.[1];
  const nextNumber = lastNumber ? Number(lastNumber) + 1 : 1;
  return `COM-${String(nextNumber).padStart(6, "0")}`;
};

const validatePurchasePayload = (body) => {
  const supplierId = Number(body.supplierId);
  const items = Array.isArray(body.items) ? body.items : [];
  const discount = Number(body.discount || 0);

  if (!Number.isInteger(supplierId) || supplierId <= 0) return { message: "Debe seleccionar un proveedor valido" };
  if (items.length === 0) return { message: "Debe agregar al menos un producto" };
  if (Number.isNaN(discount) || discount < 0) return { message: "El descuento no puede ser negativo" };

  const normalizedItems = [];
  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    const cost = Number(item.cost);

    if (!Number.isInteger(productId) || productId <= 0) return { message: "Producto invalido en la compra" };
    if (!Number.isInteger(quantity) || quantity <= 0) return { message: "La cantidad debe ser mayor que cero" };
    if (Number.isNaN(cost) || cost < 0) return { message: "El costo debe ser mayor o igual a cero" };
    normalizedItems.push({ productId, quantity, cost });
  }

  return { supplierId, items: normalizedItems, discount, notes: body.notes?.trim() || null };
};

export const listPurchases = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { companyId: requireCompanyId(req) },
      include: { supplier: { select: { id: true, name: true, rnc: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(purchases);
  } catch (error) {
    next(error);
  }
};

export const getPurchase = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de compra invalido" });

    const purchase = await prisma.purchase.findFirst({ where: { id, companyId: requireCompanyId(req) }, include: purchaseInclude });
    if (!purchase) return res.status(404).json({ message: "Compra no encontrada" });

    res.json(purchase);
  } catch (error) {
    next(error);
  }
};

export const createPurchase = async (req, res, next) => {
  try {
    const payload = validatePurchasePayload(req.body);
    if (payload.message) return res.status(400).json({ message: payload.message });

    const purchase = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const supplier = await tx.supplier.findFirst({ where: { id: payload.supplierId, companyId } });
      if (!supplier) {
        const error = new Error("Proveedor no encontrado");
        error.status = 404;
        throw error;
      }

      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = await tx.product.findMany({ where: { id: { in: productIds }, companyId } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of payload.items) {
        if (!productMap.has(item.productId)) {
          const error = new Error("Producto no encontrado en la compra");
          error.status = 404;
          throw error;
        }
      }

      const subtotal = roundMoney(payload.items.reduce((sum, item) => sum + item.quantity * item.cost, 0));
      const taxRate = await getDefaultTaxRate(tx, companyId);
      const tax = roundMoney(subtotal * taxRate);
      const discount = roundMoney(payload.discount);
      const total = roundMoney(subtotal + tax - discount);

      if (total < 0) {
        const error = new Error("El descuento no puede ser mayor que subtotal e impuestos");
        error.status = 400;
        throw error;
      }

      const documentSettings = await getDocumentSetting(tx, companyId);
      const purchaseNumber = await getNextDocumentNumber(tx, "PURCHASE", companyId);
      const createdPurchase = await tx.purchase.create({
        data: {
          companyId,
          purchaseNumber,
          supplierId: payload.supplierId,
          subtotal,
          tax,
          discount,
          total,
          paidAmount: 0,
          balance: total,
          status: "PENDING",
          notes: payload.notes || documentSettings?.purchaseNotes || null
        }
      });

      for (const item of payload.items) {
        await tx.purchaseItem.create({
          data: {
            purchaseId: createdPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost,
            total: roundMoney(item.quantity * item.cost)
          }
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            cost: item.cost
          }
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            productId: item.productId,
            type: "ENTRADA",
            quantity: item.quantity,
            reason: `Compra #${purchaseNumber}`
          }
        });
      }

      return tx.purchase.findFirst({ where: { id: createdPurchase.id, companyId }, include: purchaseInclude });
    }, { isolationLevel: "Serializable" });

    res.status(201).json(purchase);
    await createAuditLog({ action: "PURCHASE_CREATED", module: "COMPRAS", entityType: "Purchase", entityId: purchase.id, description: `Compra creada: ${purchase.purchaseNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const cancelPurchase = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de compra invalido" });

    const purchase = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const existing = await tx.purchase.findFirst({
        where: { id, companyId },
        include: { items: true, payments: true }
      });

      if (!existing) {
        const error = new Error("Compra no encontrada");
        error.status = 404;
        throw error;
      }
      if (existing.status === "PAID") {
        const error = new Error("No se puede cancelar una compra pagada");
        error.status = 400;
        throw error;
      }
      if (existing.status === "CANCELLED") {
        const error = new Error("La compra ya esta anulada");
        error.status = 400;
        throw error;
      }
      if (existing.payments.length > 0) {
        const error = new Error("No se puede cancelar una compra con pagos registrados");
        error.status = 400;
        throw error;
      }

      for (const item of existing.items) {
        const product = await tx.product.findFirst({ where: { id: item.productId, companyId } });
        if (!product || product.stock < item.quantity) {
          const error = new Error(`No se puede cancelar. Stock insuficiente para revertir ${product?.name || "producto"}`);
          error.status = 400;
          throw error;
        }
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
            reason: `Cancelacion Compra #${existing.purchaseNumber}`
          }
        });
      }

      return tx.purchase.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: purchaseInclude
      });
    }, { isolationLevel: "Serializable" });

    res.json(purchase);
    await createAuditLog({ action: "PURCHASE_CANCELLED", module: "COMPRAS", entityType: "Purchase", entityId: purchase.id, description: `Compra cancelada: ${purchase.purchaseNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const listPurchasePayments = async (req, res, next) => {
  try {
    const purchaseId = parseIdParam(req.params.id);
    if (!purchaseId) return res.status(400).json({ message: "ID de compra invalido" });

    const payments = await prisma.purchasePayment.findMany({
      where: { purchaseId, companyId: requireCompanyId(req) },
      include: {
        bankAccount: { select: { id: true, name: true, bankName: true, accountNumber: true, currentBalance: true } },
        bankTransaction: { select: { id: true, type: true, amount: true, description: true, reference: true } }
      },
      orderBy: { paymentDate: "desc" }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

export const createPurchasePayment = async (req, res, next) => {
  try {
    const purchaseId = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const method = req.body.method;
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : null;
    const cashBoxId = req.body.cashBoxId ? Number(req.body.cashBoxId) : null;
    const reference = req.body.reference?.trim() || null;
    const notes = req.body.notes?.trim() || null;
    const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate) : new Date();

    if (!purchaseId) return res.status(400).json({ message: "ID de compra invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!PAYMENT_METHODS.includes(method)) return res.status(400).json({ message: "Metodo de pago invalido" });
    if (method === "BANK_TRANSFER" && (!Number.isInteger(bankAccountId) || bankAccountId <= 0)) {
      return res.status(400).json({ message: "Debe seleccionar la cuenta bancaria que realizara el pago" });
    }
    if (method === "CASH" && (!Number.isInteger(cashBoxId) || cashBoxId <= 0)) {
      return res.status(400).json({ message: "Debe seleccionar la caja que realizara el pago" });
    }
    if (Number.isNaN(paymentDate.getTime())) return res.status(400).json({ message: "Fecha de pago invalida" });

    const result = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const purchase = await tx.purchase.findFirst({ where: { id: purchaseId, companyId } });

      if (!purchase) {
        const error = new Error("Compra no encontrada");
        error.status = 404;
        throw error;
      }
      if (purchase.status === "CANCELLED") {
        const error = new Error("No se puede pagar una compra anulada");
        error.status = 400;
        throw error;
      }
      if (purchase.status === "PAID" || Number(purchase.balance) <= 0) {
        const error = new Error("La compra ya esta pagada");
        error.status = 400;
        throw error;
      }
      if (amount > Number(purchase.balance)) {
        const error = new Error("El monto no puede ser mayor al balance pendiente");
        error.status = 400;
        throw error;
      }

      let bankTransaction = null;
      if (method === "BANK_TRANSFER") {
        const bankAccount = await tx.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
        if (!bankAccount || !bankAccount.isActive) {
          const error = new Error("Cuenta bancaria no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(bankAccount.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en la cuenta bancaria seleccionada");
          error.status = 400;
          throw error;
        }

        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: roundMoney(Number(bankAccount.currentBalance) - amount) }
        });

        bankTransaction = await tx.bankTransaction.create({
          data: {
            companyId,
            bankAccountId,
            type: "WITHDRAWAL",
            amount,
            description: `Pago compra #${purchase.purchaseNumber}`,
            reference,
            transactionDate: paymentDate
          }
        });
      }
      if (method === "CASH") {
        const cashBox = await tx.cashBox.findFirst({ where: { id: cashBoxId, companyId } });
        if (!cashBox || !cashBox.isActive) {
          const error = new Error("Caja no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        if (Number(cashBox.currentBalance) < amount) {
          const error = new Error("Balance insuficiente en la caja seleccionada");
          error.status = 400;
          throw error;
        }
        await tx.cashBox.update({
          where: { id: cashBoxId },
          data: { currentBalance: roundMoney(Number(cashBox.currentBalance) - amount) }
        });
        await tx.cashTransaction.create({
          data: {
            companyId,
            cashBoxId,
            type: "CASH_OUT",
            amount,
            description: `Pago compra #${purchase.purchaseNumber}`,
            reference,
            transactionDate: paymentDate
          }
        });
      }

      const nextPaidAmount = roundMoney(Number(purchase.paidAmount) + amount);
      const nextBalance = roundMoney(Number(purchase.total) - nextPaidAmount);
      const nextStatus = nextBalance <= 0 ? "PAID" : "PARTIAL";

      const payment = await tx.purchasePayment.create({
        data: {
          companyId,
          purchaseId,
          bankAccountId: method === "BANK_TRANSFER" ? bankAccountId : null,
          bankTransactionId: bankTransaction?.id || null,
          amount,
          method,
          reference,
          notes,
          paymentDate
        }
      });

      const updatedPurchase = await tx.purchase.update({
        where: { id: purchaseId },
        data: { paidAmount: nextPaidAmount, balance: nextBalance, status: nextStatus },
        include: purchaseInclude
      });

      return { payment, purchase: updatedPurchase };
    }, { isolationLevel: "Serializable" });

    res.status(201).json(result);
    await createAuditLog({ action: "PURCHASE_PAYMENT_CREATED", module: "COMPRAS", entityType: "PurchasePayment", entityId: result.payment.id, description: `Pago registrado a compra ${result.purchase.purchaseNumber}`, req });
  } catch (error) {
    next(error);
  }
};

export const downloadPurchasePdf = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) return res.status(400).json({ message: "ID de compra invalido" });

    const companyId = requireCompanyId(req);
    const purchase = await prisma.purchase.findFirst({ where: { id, companyId }, include: purchaseInclude });
    if (!purchase) return res.status(404).json({ message: "Compra no encontrada" });

    const [company, documentSettings] = await Promise.all([prisma.companySetting.findFirst({ where: { companyId } }), prisma.documentSetting.findFirst({ where: { companyId } })]);
    sendDocumentPdf(res, {
      filename: `${purchase.purchaseNumber}.pdf`,
      title: `Compra ${purchase.purchaseNumber}`,
      subtitle: "Documento generado desde Gestion Pro",
      details: {
        Fecha: purchase.createdAt,
        Proveedor: purchase.supplier?.name,
        RNC: purchase.supplier?.rnc,
        Estado: purchase.status
      },
      company,
      documentSettings,
      columns: [
        { header: "Codigo", value: (item) => item.product?.code },
        { header: "Producto", value: (item) => item.product?.name },
        { header: "Cantidad", value: (item) => item.quantity },
        { header: "Costo", value: (item) => Number(item.cost) },
        { header: "Total", value: (item) => Number(item.total) }
      ],
      rows: purchase.items,
      totals: {
        Subtotal: Number(purchase.subtotal),
        Impuesto: Number(purchase.tax),
        Descuento: Number(purchase.discount),
        Total: Number(purchase.total),
        Pagado: Number(purchase.paidAmount),
        Balance: Number(purchase.balance)
      },
      notes: purchase.notes || documentSettings?.purchaseNotes,
      terms: documentSettings?.purchaseTerms
    });
  } catch (error) {
    next(error);
  }
};
