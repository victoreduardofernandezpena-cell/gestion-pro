const originKey = (sourceType, sourceId) => `${sourceType}:${sourceId}`;

const uniqueIdsByType = (transactions, sourceType) => [
  ...new Set(
    transactions
      .filter((transaction) => transaction.sourceType === sourceType && Number.isInteger(Number(transaction.sourceId)))
      .map((transaction) => Number(transaction.sourceId))
      .filter((id) => id > 0)
  )
];

const originMeta = {
  INVOICE_PAYMENT: { label: "Pago de factura" },
  PURCHASE_PAYMENT: { label: "Pago de compra" },
  EXPENSE: { label: "Gasto" },
  BANK_TRANSFER: { label: "Transferencia bancaria", path: (id) => `/banco/${id}` },
  MANUAL_BANK_MOVEMENT: { label: "Movimiento manual de banco", isManual: true },
  MANUAL_CASH_MOVEMENT: { label: "Movimiento manual de caja", isManual: true }
};

export const buildFinancialOrigin = (transaction, resolvedOrigin = null) => {
  if (!transaction?.sourceType) {
    return {
      type: "UNTRACKED",
      label: "Sin origen registrado",
      documentLabel: "Movimiento anterior o sin clasificar",
      path: null,
      isManual: false,
      isLinked: false,
      status: "missing"
    };
  }

  const meta = originMeta[transaction.sourceType] || { label: "Origen externo" };
  const path = resolvedOrigin?.path || (meta.path && transaction.sourceId ? meta.path(transaction.sourceId) : null);
  const documentLabel = resolvedOrigin?.documentLabel || transaction.sourceNumber || (meta.isManual ? "Registrado manualmente" : "Origen no resuelto");

  return {
    type: transaction.sourceType,
    label: meta.label,
    documentId: resolvedOrigin?.documentId || transaction.sourceId || null,
    documentLabel,
    path,
    isManual: Boolean(meta.isManual),
    isLinked: Boolean(path),
    status: path || meta.isManual ? "resolved" : "unresolved"
  };
};

export const financialOriginToText = (origin) => {
  if (!origin) return "Sin origen registrado";
  return [origin.label, origin.documentLabel].filter(Boolean).join(" - ");
};

export const buildPaymentTarget = (transaction) => {
  if (!transaction) return null;
  if (transaction.bankAccount) {
    return {
      type: "BANK",
      label: `${transaction.bankAccount.bankName || "Banco"} - ${transaction.bankAccount.name}`,
      path: `/banco/${transaction.bankAccount.id}`,
      transactionId: transaction.id
    };
  }
  if (transaction.cashBox) {
    return {
      type: "CASH_BOX",
      label: transaction.cashBox.name,
      path: `/caja-chica/${transaction.cashBox.id}`,
      transactionId: transaction.id
    };
  }
  return null;
};

export const paymentTargetToText = (target) => target?.label || "Sin destino financiero";

const paymentMatchKey = (payment) => {
  const amount = Number(payment.amount || 0).toFixed(2);
  const reference = payment.reference || "";
  const date = payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 10) : "";
  return `${amount}|${reference}|${date}`;
};

const transactionMatchKey = (transaction) => {
  const amount = Number(transaction.amount || 0).toFixed(2);
  const reference = transaction.reference || "";
  const date = transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().slice(0, 10) : "";
  return `${amount}|${reference}|${date}`;
};

const takeFirstByKey = (map, key) => {
  const items = map.get(key) || [];
  const [item, ...rest] = items;
  if (rest.length) map.set(key, rest);
  else map.delete(key);
  return item || null;
};

export const attachInvoicePaymentTargets = async (payments, { prismaClient, companyId }) => {
  const paymentIds = payments.map((payment) => Number(payment.id)).filter((id) => Number.isInteger(id) && id > 0);
  if (!paymentIds.length) return payments;

  const [bankTransactions, cashTransactions] = await Promise.all([
    prismaClient.bankTransaction.findMany({
      where: { companyId, sourceType: "INVOICE_PAYMENT", sourceId: { in: paymentIds } },
      include: { bankAccount: { select: { id: true, name: true, bankName: true } } }
    }),
    prismaClient.cashTransaction.findMany({
      where: { companyId, sourceType: "INVOICE_PAYMENT", sourceId: { in: paymentIds } },
      include: { cashBox: { select: { id: true, name: true } } }
    })
  ]);

  const targetByPaymentId = new Map();
  for (const transaction of [...bankTransactions, ...cashTransactions]) {
    targetByPaymentId.set(Number(transaction.sourceId), buildPaymentTarget(transaction));
  }

  return payments.map((payment) => {
    const target = targetByPaymentId.get(Number(payment.id)) || null;
    return { ...payment, financialTarget: target, financialTargetLabel: paymentTargetToText(target) };
  });
};

export const attachPurchasePaymentTargets = async (purchase, { prismaClient, companyId }) => {
  const payments = purchase?.payments || [];
  if (!payments.length) return purchase;

  const cashPayments = payments.filter((payment) => payment.method === "CASH");
  if (!cashPayments.length) {
    return {
      ...purchase,
      payments: payments.map((payment) => {
        const target = buildPaymentTarget(payment.bankTransaction || null) || (payment.bankAccount ? { type: "BANK", label: `${payment.bankAccount.bankName || "Banco"} - ${payment.bankAccount.name}`, path: `/banco/${payment.bankAccount.id}`, transactionId: payment.bankTransactionId || null } : null);
        return { ...payment, financialTarget: target, financialTargetLabel: paymentTargetToText(target) };
      })
    };
  }

  const cashTransactions = await prismaClient.cashTransaction.findMany({
    where: { companyId, sourceType: "PURCHASE_PAYMENT", sourceId: purchase.id },
    include: { cashBox: { select: { id: true, name: true } } },
    orderBy: { transactionDate: "desc" }
  });

  const cashByKey = cashTransactions.reduce((map, transaction) => {
    const key = transactionMatchKey(transaction);
    map.set(key, [...(map.get(key) || []), transaction]);
    return map;
  }, new Map());

  return {
    ...purchase,
    payments: payments.map((payment) => {
      const bankTarget = buildPaymentTarget(payment.bankTransaction || null) || (payment.bankAccount ? { type: "BANK", label: `${payment.bankAccount.bankName || "Banco"} - ${payment.bankAccount.name}`, path: `/banco/${payment.bankAccount.id}`, transactionId: payment.bankTransactionId || null } : null);
      const cashTarget = payment.method === "CASH" ? buildPaymentTarget(takeFirstByKey(cashByKey, paymentMatchKey(payment))) : null;
      const target = bankTarget || cashTarget;
      return { ...payment, financialTarget: target, financialTargetLabel: paymentTargetToText(target) };
    })
  };
};

export const resolveFinancialOriginMap = async (transactions, { prismaClient, companyId }) => {
  const originMap = new Map();
  const invoicePaymentIds = uniqueIdsByType(transactions, "INVOICE_PAYMENT");
  const purchaseIds = uniqueIdsByType(transactions, "PURCHASE_PAYMENT");
  const expenseIds = uniqueIdsByType(transactions, "EXPENSE");
  const bankTransferAccountIds = uniqueIdsByType(transactions, "BANK_TRANSFER");

  const [invoicePayments, purchases, expenses, bankAccounts] = await Promise.all([
    invoicePaymentIds.length
      ? prismaClient.payment.findMany({
        where: { companyId, id: { in: invoicePaymentIds } },
        select: { id: true, invoice: { select: { id: true, invoiceNumber: true } } }
      })
      : [],
    purchaseIds.length
      ? prismaClient.purchase.findMany({
        where: { companyId, id: { in: purchaseIds } },
        select: { id: true, purchaseNumber: true }
      })
      : [],
    expenseIds.length
      ? prismaClient.expense.findMany({
        where: { companyId, id: { in: expenseIds } },
        select: { id: true, description: true }
      })
      : [],
    bankTransferAccountIds.length
      ? prismaClient.bankAccount.findMany({
        where: { companyId, id: { in: bankTransferAccountIds } },
        select: { id: true, bankName: true, name: true }
      })
      : []
  ]);

  for (const payment of invoicePayments) {
    if (!payment.invoice) continue;
    originMap.set(originKey("INVOICE_PAYMENT", payment.id), {
      documentId: payment.invoice.id,
      documentLabel: payment.invoice.invoiceNumber,
      path: `/invoices/${payment.invoice.id}`
    });
  }

  for (const purchase of purchases) {
    originMap.set(originKey("PURCHASE_PAYMENT", purchase.id), {
      documentId: purchase.id,
      documentLabel: purchase.purchaseNumber,
      path: `/purchases/${purchase.id}`
    });
  }

  for (const expense of expenses) {
    originMap.set(originKey("EXPENSE", expense.id), {
      documentId: expense.id,
      documentLabel: expense.description,
      path: `/gastos?expenseId=${expense.id}`
    });
  }

  for (const account of bankAccounts) {
    originMap.set(originKey("BANK_TRANSFER", account.id), {
      documentId: account.id,
      documentLabel: `${account.bankName || "Banco"} - ${account.name}`,
      path: `/banco/${account.id}`
    });
  }

  return originMap;
};

export const attachFinancialOrigins = async (transactions, { prismaClient, companyId }) => {
  const originMap = await resolveFinancialOriginMap(transactions, { prismaClient, companyId });
  return transactions.map((transaction) => {
    const origin = buildFinancialOrigin(transaction, originMap.get(originKey(transaction.sourceType, Number(transaction.sourceId))));
    return { ...transaction, origin, originLabel: financialOriginToText(origin) };
  });
};

export const attachFinancialOriginsToResult = async (result, options) => {
  if (Array.isArray(result)) return attachFinancialOrigins(result, options);
  const data = await attachFinancialOrigins(result.data || [], options);
  return { ...result, data };
};
