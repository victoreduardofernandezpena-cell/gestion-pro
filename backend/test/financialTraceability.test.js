import test from "node:test";
import assert from "node:assert/strict";
import { attachFinancialOrigins, attachInvoicePaymentTargets, attachPurchasePaymentTargets, buildFinancialOrigin, buildPaymentTarget, financialOriginToText } from "../src/utils/financialTraceability.js";

test("buildFinancialOrigin creates manual movement labels without links", () => {
  const origin = buildFinancialOrigin({ sourceType: "MANUAL_BANK_MOVEMENT" });

  assert.equal(origin.label, "Movimiento manual de banco");
  assert.equal(origin.documentLabel, "Registrado manualmente");
  assert.equal(origin.isManual, true);
  assert.equal(origin.isLinked, false);
});

test("buildFinancialOrigin marks legacy transactions without source", () => {
  const origin = buildFinancialOrigin({});

  assert.equal(origin.type, "UNTRACKED");
  assert.equal(origin.status, "missing");
  assert.equal(origin.isLinked, false);
});

test("attachFinancialOrigins links invoice payments to the invoice detail", async () => {
  const prismaClient = {
    payment: {
      findMany: async () => [{ id: 9, invoice: { id: 3, invoiceNumber: "FAC-000003" } }]
    },
    purchase: { findMany: async () => [] },
    expense: { findMany: async () => [] },
    bankAccount: { findMany: async () => [] }
  };

  const [transaction] = await attachFinancialOrigins(
    [{ id: 1, companyId: 4, sourceType: "INVOICE_PAYMENT", sourceId: 9, sourceNumber: "FAC-000003" }],
    { prismaClient, companyId: 4 }
  );

  assert.equal(transaction.origin.label, "Pago de factura");
  assert.equal(transaction.origin.documentLabel, "FAC-000003");
  assert.equal(transaction.origin.path, "/invoices/3");
  assert.equal(financialOriginToText(transaction.origin), "Pago de factura - FAC-000003");
});

test("attachFinancialOrigins links purchases, expenses and bank transfers", async () => {
  const prismaClient = {
    payment: { findMany: async () => [] },
    purchase: { findMany: async () => [{ id: 5, purchaseNumber: "COM-000005" }] },
    expense: { findMany: async () => [{ id: 8, description: "Alquiler oficina" }] },
    bankAccount: { findMany: async () => [{ id: 2, bankName: "Banco Demo", name: "Principal" }] }
  };

  const transactions = await attachFinancialOrigins(
    [
      { id: 1, sourceType: "PURCHASE_PAYMENT", sourceId: 5 },
      { id: 2, sourceType: "EXPENSE", sourceId: 8 },
      { id: 3, sourceType: "BANK_TRANSFER", sourceId: 2 }
    ],
    { prismaClient, companyId: 1 }
  );

  assert.equal(transactions[0].origin.path, "/purchases/5");
  assert.equal(transactions[1].origin.path, "/gastos?expenseId=8");
  assert.equal(transactions[2].origin.path, "/banco/2");
});

test("buildPaymentTarget creates bank and cash payment destinations", () => {
  assert.deepEqual(buildPaymentTarget({ id: 4, bankAccount: { id: 2, bankName: "Banco Demo", name: "Principal" } }), {
    type: "BANK",
    label: "Banco Demo - Principal",
    path: "/banco/2",
    transactionId: 4
  });
  assert.deepEqual(buildPaymentTarget({ id: 7, cashBox: { id: 3, name: "Caja Principal" } }), {
    type: "CASH_BOX",
    label: "Caja Principal",
    path: "/caja-chica/3",
    transactionId: 7
  });
});

test("attachInvoicePaymentTargets links invoice payments to bank or cash destinations", async () => {
  const prismaClient = {
    bankTransaction: { findMany: async () => [{ id: 11, sourceId: 1, bankAccount: { id: 5, bankName: "Banco A", name: "Cuenta Ventas" } }] },
    cashTransaction: { findMany: async () => [{ id: 12, sourceId: 2, cashBox: { id: 6, name: "Caja Ventas" } }] }
  };

  const payments = await attachInvoicePaymentTargets([{ id: 1 }, { id: 2 }], { prismaClient, companyId: 9 });

  assert.equal(payments[0].financialTarget.path, "/banco/5");
  assert.equal(payments[1].financialTarget.path, "/caja-chica/6");
});

test("attachPurchasePaymentTargets links purchase cash payments by amount, reference and date", async () => {
  const prismaClient = {
    cashTransaction: {
      findMany: async () => [{ id: 20, amount: 300, reference: "REC-1", transactionDate: new Date("2026-07-10"), cashBox: { id: 8, name: "Caja Compras" } }]
    }
  };

  const purchase = await attachPurchasePaymentTargets({
    id: 5,
    payments: [{ id: 1, method: "CASH", amount: 300, reference: "REC-1", paymentDate: new Date("2026-07-10") }]
  }, { prismaClient, companyId: 1 });

  assert.equal(purchase.payments[0].financialTarget.path, "/caja-chica/8");
});
