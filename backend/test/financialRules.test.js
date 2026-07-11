import test from "node:test";
import assert from "node:assert/strict";
import { applyPaymentBreakdown, calculateMovementBalance, calculatePaymentState, roundMoney } from "../src/utils/financialRules.js";

test("roundMoney keeps financial values stable to two decimals", () => {
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney("20.199"), 20.2);
});

test("calculatePaymentState marks partial and full payments correctly", () => {
  const invoice = { total: 100, paidAmount: 0, balance: 100 };
  assert.deepEqual(calculatePaymentState(invoice, 25), { nextPaidAmount: 25, nextBalance: 75, nextStatus: "PARTIAL" });
  assert.deepEqual(calculatePaymentState(invoice, 100), { nextPaidAmount: 100, nextBalance: 0, nextStatus: "PAID" });
});

test("calculatePaymentState rejects overpayment", () => {
  assert.throws(
    () => calculatePaymentState({ total: 100, paidAmount: 50, balance: 50 }, 51),
    /El monto no puede ser mayor al balance pendiente/
  );
});

test("applyPaymentBreakdown applies only the pending balance and returns change", () => {
  const result = applyPaymentBreakdown(80, [
    { method: "CASH", amount: 30 },
    { method: "BANK_TRANSFER", amount: 70 }
  ]);

  assert.equal(result.received, 100);
  assert.equal(result.applied, 80);
  assert.equal(result.change, 20);
  assert.equal(result.remaining, 0);
  assert.deepEqual(result.appliedPayments.map((payment) => payment.appliedAmount), [30, 50]);
});

test("calculateMovementBalance blocks negative bank or cash balances", () => {
  assert.equal(calculateMovementBalance(100, 25, "DEPOSIT"), 125);
  assert.equal(calculateMovementBalance(100, 25, "WITHDRAWAL"), 75);
  assert.throws(
    () => calculateMovementBalance(10, 25, "WITHDRAWAL", { insufficientMessage: "Balance insuficiente en la cuenta bancaria" }),
    /Balance insuficiente en la cuenta bancaria/
  );
});
