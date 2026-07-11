import test from "node:test";
import assert from "node:assert/strict";
import { attachFinancialOrigins, buildFinancialOrigin, financialOriginToText } from "../src/utils/financialTraceability.js";

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
