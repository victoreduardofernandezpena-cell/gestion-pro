export const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const calculatePaymentState = (
  document,
  amount,
  { overpaymentMessage = "El monto no puede ser mayor al balance pendiente" } = {}
) => {
  const paymentAmount = Number(amount);
  const total = Number(document.total || 0);
  const paidAmount = Number(document.paidAmount || 0);
  const balance = roundMoney(document.balance ?? total - paidAmount);

  if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
    const error = new Error("El monto debe ser mayor que cero");
    error.status = 400;
    throw error;
  }

  if (paymentAmount > balance) {
    const error = new Error(overpaymentMessage);
    error.status = 400;
    throw error;
  }

  const nextPaidAmount = roundMoney(paidAmount + paymentAmount);
  const nextBalance = roundMoney(total - nextPaidAmount);
  const nextStatus = nextBalance <= 0 ? "PAID" : "PARTIAL";

  return { nextPaidAmount, nextBalance, nextStatus };
};

export const applyPaymentBreakdown = (balance, payments = []) => {
  let remaining = roundMoney(balance);
  const received = roundMoney(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
  const appliedPayments = [];

  for (const payment of payments) {
    if (remaining <= 0) break;
    const appliedAmount = roundMoney(Math.min(Number(payment.amount || 0), remaining));
    if (appliedAmount <= 0) continue;
    appliedPayments.push({ ...payment, appliedAmount });
    remaining = roundMoney(remaining - appliedAmount);
  }

  const applied = roundMoney(Number(balance || 0) - remaining);
  const change = roundMoney(Math.max(received - applied, 0));

  return { received, applied, change, remaining, appliedPayments };
};

export const calculateMovementBalance = (
  currentBalance,
  amount,
  type,
  { increaseTypes = ["DEPOSIT", "CASH_IN", "TRANSFER_IN"], insufficientMessage = "Balance insuficiente" } = {}
) => {
  const current = Number(currentBalance || 0);
  const movementAmount = Number(amount || 0);
  const nextBalance = increaseTypes.includes(type) ? current + movementAmount : current - movementAmount;

  if (nextBalance < 0) {
    const error = new Error(insufficientMessage);
    error.status = 400;
    throw error;
  }

  return roundMoney(nextBalance);
};
