import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { PAYMENT_METHODS } from "../constants/billing.js";

export const listInvoicePayments = async (req, res, next) => {
  try {
    const invoiceId = parseIdParam(req.params.id);
    if (!invoiceId) return res.status(400).json({ message: "ID de factura invalido" });

    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: "desc" }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

export const createInvoicePayment = async (req, res, next) => {
  try {
    const invoiceId = parseIdParam(req.params.id);
    const amount = Number(req.body.amount);
    const method = req.body.method;
    const reference = req.body.reference?.trim() || null;
    const notes = req.body.notes?.trim() || null;
    const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate) : new Date();

    if (!invoiceId) return res.status(400).json({ message: "ID de factura invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!PAYMENT_METHODS.includes(method)) return res.status(400).json({ message: "Metodo de pago invalido" });
    if (Number.isNaN(paymentDate.getTime())) return res.status(400).json({ message: "Fecha de pago invalida" });

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });

      if (!invoice) {
        const error = new Error("Factura no encontrada");
        error.status = 404;
        throw error;
      }
      if (invoice.status === "CANCELLED") {
        const error = new Error("No se puede pagar una factura anulada");
        error.status = 400;
        throw error;
      }
      if (invoice.status === "PAID" || Number(invoice.balance) <= 0) {
        const error = new Error("La factura ya esta pagada");
        error.status = 400;
        throw error;
      }

      const balance = Number(invoice.balance);
      if (amount > balance) {
        const error = new Error("El monto no puede ser mayor al balance pendiente");
        error.status = 400;
        throw error;
      }

      const nextPaidAmount = Math.round((Number(invoice.paidAmount) + amount + Number.EPSILON) * 100) / 100;
      const nextBalance = Math.round((Number(invoice.total) - nextPaidAmount + Number.EPSILON) * 100) / 100;
      const nextStatus = nextBalance <= 0 ? "PAID" : "PARTIAL";

      const payment = await tx.payment.create({
        data: { invoiceId, amount, method, reference, notes, paymentDate }
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: nextPaidAmount,
          balance: nextBalance,
          status: nextStatus
        },
        include: {
          client: { select: { id: true, name: true, rnc: true } },
          items: { include: { product: { select: { id: true, code: true, name: true } } } },
          payments: { orderBy: { paymentDate: "desc" } }
        }
      });

      return { payment, invoice: updatedInvoice };
    }, { isolationLevel: "Serializable" });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
