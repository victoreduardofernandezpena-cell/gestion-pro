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
