import prisma from "../prisma.js";
import { parseIdParam } from "../utils/http.js";
import { PAYMENT_METHODS } from "../constants/billing.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { calculateLoyaltyReward, getActiveLoyaltySetting } from "../utils/loyaltyCalculator.js";
import { requireCompanyId } from "../utils/companyScope.js";

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const listInvoicePayments = async (req, res, next) => {
  try {
    const invoiceId = parseIdParam(req.params.id);
    if (!invoiceId) return res.status(400).json({ message: "ID de factura invalido" });

    const payments = await prisma.payment.findMany({
      where: { invoiceId, companyId: requireCompanyId(req) },
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
    const bankAccountId = req.body.bankAccountId ? Number(req.body.bankAccountId) : null;
    const cashBoxId = req.body.cashBoxId ? Number(req.body.cashBoxId) : null;
    const reference = req.body.reference?.trim() || null;
    const notes = req.body.notes?.trim() || null;
    const paymentDate = req.body.paymentDate ? new Date(req.body.paymentDate) : new Date();

    if (!invoiceId) return res.status(400).json({ message: "ID de factura invalido" });
    if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ message: "El monto debe ser mayor que cero" });
    if (!PAYMENT_METHODS.includes(method)) return res.status(400).json({ message: "Metodo de pago invalido" });
    if (bankAccountId && (!Number.isInteger(bankAccountId) || bankAccountId <= 0)) return res.status(400).json({ message: "Cuenta bancaria invalida" });
    if (cashBoxId && (!Number.isInteger(cashBoxId) || cashBoxId <= 0)) return res.status(400).json({ message: "Caja invalida" });
    if (method === "BANK_TRANSFER" && !bankAccountId) return res.status(400).json({ message: "Debe seleccionar la cuenta bancaria que recibira el pago" });
    if (method === "CASH" && !cashBoxId) return res.status(400).json({ message: "Debe seleccionar la caja que recibira el pago" });
    if (Number.isNaN(paymentDate.getTime())) return res.status(400).json({ message: "Fecha de pago invalida" });

    const result = await prisma.$transaction(async (tx) => {
      const companyId = requireCompanyId(req);
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, companyId } });

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
        data: { companyId, invoiceId, amount, method, reference, notes, paymentDate }
      });

      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findFirst({ where: { id: bankAccountId, companyId } });
        if (!bankAccount || !bankAccount.isActive) {
          const error = new Error("Cuenta bancaria no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: { currentBalance: roundMoney(Number(bankAccount.currentBalance) + amount) }
        });
        await tx.bankTransaction.create({
          data: {
            companyId,
            bankAccountId,
            type: "DEPOSIT",
            amount,
            description: `Cobro factura #${invoice.invoiceNumber}`,
            reference,
            transactionDate: paymentDate
          }
        });
      }

      if (cashBoxId) {
        const cashBox = await tx.cashBox.findFirst({ where: { id: cashBoxId, companyId } });
        if (!cashBox || !cashBox.isActive) {
          const error = new Error("Caja no encontrada o inactiva");
          error.status = 404;
          throw error;
        }
        await tx.cashBox.update({
          where: { id: cashBoxId },
          data: { currentBalance: roundMoney(Number(cashBox.currentBalance) + amount) }
        });
        await tx.cashTransaction.create({
          data: {
            companyId,
            cashBoxId,
            type: "CASH_IN",
            amount,
            description: `Cobro factura #${invoice.invoiceNumber}`,
            reference,
            transactionDate: paymentDate
          }
        });
      }

      let loyaltyReward = null;
      const loyaltyAccount = await tx.loyaltyAccount.findUnique({ where: { companyId_clientId: { companyId, clientId: invoice.clientId } } });
      if (loyaltyAccount?.isActive) {
        const setting = await getActiveLoyaltySetting(tx, companyId);
        const purchaseBase = Math.max(Number(invoice.subtotal) - Number(invoice.discount || 0) - Number(invoice.loyaltyDiscount || 0), 0);
        const invoiceTotal = Math.max(Number(invoice.total), 0);
        const rewardableAmount = invoiceTotal > 0 ? roundMoney(amount * (purchaseBase / invoiceTotal)) : 0;
        const reward = calculateLoyaltyReward(rewardableAmount, setting);
        if (reward > 0) {
          loyaltyReward = await tx.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: loyaltyAccount.id,
              companyId,
              clientId: invoice.clientId,
              invoiceId,
              paymentId: payment.id,
              type: "EARNED",
              amount: reward,
              points: reward,
              description: `Recompensa por pago de factura`
            }
          });
          await tx.loyaltyAccount.update({
            where: { id: loyaltyAccount.id },
            data: {
              moneyBalance: { increment: reward },
              pointsBalance: { increment: reward },
              totalEarned: { increment: reward }
            }
          });
        }
      }

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
          payments: { orderBy: { paymentDate: "desc" } },
          loyaltyTransactions: { include: { loyaltyAccount: { select: { id: true, credentialCode: true } } }, orderBy: { createdAt: "desc" } }
        }
      });

      return { payment, invoice: updatedInvoice, loyaltyReward };
    }, { isolationLevel: "Serializable" });

    res.status(201).json(result);
    await createAuditLog({ action: "INVOICE_PAYMENT_CREATED", module: "FACTURACION", entityType: "Payment", entityId: result.payment.id, description: `Pago registrado a factura ${result.invoice.invoiceNumber}`, req });
    if (result.loyaltyReward) {
      await createAuditLog({ action: "LOYALTY_REWARD_EARNED", module: "FIDELIZACION", entityType: "Payment", entityId: result.payment.id, description: `Recompensa generada por factura ${result.invoice.invoiceNumber}`, req });
    }
  } catch (error) {
    next(error);
  }
};
