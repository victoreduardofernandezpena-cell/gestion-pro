import { getLastBackupInfo, monthKey as dashboardMonthKey, roundMoney, sumBy } from "./dashboardAnalytics.js";

const VALID_PERIODS = ["today", "week", "month", "quarter", "year", "custom"];
const RECEIVABLE_STATUSES = ["PENDING", "PARTIAL"];
const PAYABLE_STATUSES = ["PENDING", "PARTIAL"];

export const resolveFinanceRange = ({ period = "month", startDate, endDate } = {}) => {
  const normalized = VALID_PERIODS.includes(period) ? period : "month";
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (normalized === "custom") {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      const error = new Error("Rango de fechas invalido");
      error.status = 400;
      throw error;
    }
    if (parsedStart > parsedEnd) {
      const error = new Error("La fecha inicial no puede ser mayor que la fecha final");
      error.status = 400;
      throw error;
    }
    parsedStart.setHours(0, 0, 0, 0);
    parsedEnd.setHours(23, 59, 59, 999);
    return { period: normalized, start: parsedStart, end: parsedEnd };
  }

  if (normalized === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (normalized === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  } else if (normalized === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (normalized === "quarter") {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (normalized === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }

  end.setHours(23, 59, 59, 999);
  return { period: normalized, start, end };
};

export const monthKey = dashboardMonthKey;

const rangeWhere = (field, start, end) => ({ [field]: { gte: start, lte: end } });

const dateLabel = (date) => new Date(date).toISOString().slice(0, 10);

const asMoney = (value) => roundMoney(value);

const percentage = (value, base) => (Number(base || 0) > 0 ? roundMoney((Number(value || 0) / Number(base)) * 100) : 0);

const getCostOfGoodsSold = (invoiceItems) => sumBy(invoiceItems, (item) => Number(item.cost) * Number(item.quantity));

const groupByMonth = (rows, datePicker, valuePicker, keyName, seed = new Map()) => {
  for (const row of rows) {
    const key = monthKey(datePicker(row));
    const current = seed.get(key) || { month: key };
    current[keyName] = Number(current[keyName] || 0) + Number(valuePicker(row) || 0);
    seed.set(key, current);
  }
  return seed;
};

const initializeMonthMap = (start, end) => {
  const map = new Map();
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const key = monthKey(cursor);
    map.set(key, { month: key });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return map;
};

const sortByValueDesc = (rows, key = "total") => rows.sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0));

const findExpenseDuplicate = (transaction, expenses) => {
  const description = (transaction.description || "").toLowerCase();
  if (description.startsWith("gasto:")) return true;
  if (description.startsWith("cobro factura")) return true;
  if (!transaction.reference) return false;
  return expenses.some((expense) => expense.reference === transaction.reference && Number(expense.amount) === Number(transaction.amount));
};

const isManualBankMovement = (transaction, expenses) => {
  if (transaction.purchasePayment) return false;
  if (findExpenseDuplicate(transaction, expenses)) return false;
  return true;
};

const isManualCashMovement = (transaction, expenses) => !findExpenseDuplicate(transaction, expenses);

const normalizeMoneyFields = (row) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? asMoney(value) : value])
);

export const fetchFinanceDataset = async (prisma, companyId, start, end) => {
  const createdAtRange = rangeWhere("createdAt", start, end);
  const paymentDateRange = rangeWhere("paymentDate", start, end);
  const expenseDateRange = rangeWhere("expenseDate", start, end);
  const transactionDateRange = rangeWhere("transactionDate", start, end);

  const [
    invoices,
    invoiceItems,
    payments,
    purchases,
    purchasePayments,
    expenses,
    bankAccounts,
    cashBoxes,
    bankTransactions,
    cashTransactions,
    receivableInvoices,
    payablePurchases,
    loyaltyAccounts,
    loyaltyTransactions,
    products
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId, status: { not: "CANCELLED" }, ...createdAtRange },
      include: { client: { select: { id: true, name: true } } }
    }),
    prisma.invoiceItem.findMany({
      where: { invoice: { companyId, status: { not: "CANCELLED" }, createdAt: { gte: start, lte: end } } },
      include: {
        product: { select: { id: true, code: true, name: true } },
        invoice: { select: { id: true, clientId: true, createdAt: true, client: { select: { id: true, name: true } } } }
      }
    }),
    prisma.payment.findMany({
      where: { companyId, ...paymentDateRange, invoice: { status: { not: "CANCELLED" } } },
      include: { invoice: { select: { invoiceNumber: true, client: { select: { name: true } } } } }
    }),
    prisma.purchase.findMany({
      where: { companyId, status: { not: "CANCELLED" }, ...createdAtRange },
      include: { supplier: { select: { id: true, name: true } } }
    }),
    prisma.purchasePayment.findMany({
      where: { companyId, ...paymentDateRange, purchase: { status: { not: "CANCELLED" } } },
      include: { purchase: { select: { purchaseNumber: true, supplier: { select: { name: true } } } } }
    }),
    prisma.expense.findMany({ where: { companyId, ...expenseDateRange } }),
    prisma.bankAccount.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, bankName: true, currentBalance: true } }),
    prisma.cashBox.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, currentBalance: true } }),
    prisma.bankTransaction.findMany({
      where: { companyId, ...transactionDateRange },
      include: { bankAccount: { select: { name: true } }, purchasePayment: { select: { id: true } } }
    }),
    prisma.cashTransaction.findMany({
      where: { companyId, ...transactionDateRange },
      include: { cashBox: { select: { name: true } } }
    }),
    prisma.invoice.findMany({
      where: { companyId, status: { in: RECEIVABLE_STATUSES } },
      include: { client: { select: { id: true, name: true } } }
    }),
    prisma.purchase.findMany({
      where: { companyId, status: { in: PAYABLE_STATUSES } },
      include: { supplier: { select: { id: true, name: true } } }
    }),
    prisma.loyaltyAccount.findMany({
      where: { companyId, isActive: true },
      include: { client: { select: { id: true, name: true } } }
    }).catch(() => []),
    prisma.loyaltyTransaction.findMany({
      where: { companyId, createdAt: { gte: start, lte: end } }
    }).catch(() => []),
    prisma.product.findMany({ where: { companyId }, select: { id: true, name: true, stock: true, minimumStock: true } })
  ]);

  return {
    invoices,
    invoiceItems,
    payments,
    purchases,
    purchasePayments,
    expenses,
    bankAccounts,
    cashBoxes,
    bankTransactions,
    cashTransactions,
    receivableInvoices,
    payablePurchases,
    loyaltyAccounts,
    loyaltyTransactions,
    products
  };
};

export const buildSummary = (data, period) => {
  const totalSales = sumBy(data.invoices, (invoice) => invoice.total);
  const totalCollected = sumBy(data.payments, (payment) => payment.amount);
  const totalPurchases = sumBy(data.purchases, (purchase) => purchase.total);
  const totalPaidToSuppliers = sumBy(data.purchasePayments, (payment) => payment.amount);
  const totalExpenses = sumBy(data.expenses, (expense) => expense.amount);
  const costOfGoodsSold = getCostOfGoodsSold(data.invoiceItems);
  const grossProfit = totalSales - costOfGoodsSold;
  const netProfit = grossProfit - totalExpenses;
  const accountsReceivable = sumBy(data.receivableInvoices, (invoice) => invoice.balance);
  const accountsPayable = sumBy(data.payablePurchases, (purchase) => purchase.balance);
  const bankBalance = sumBy(data.bankAccounts, (account) => account.currentBalance);
  const cashBoxBalance = sumBy(data.cashBoxes, (box) => box.currentBalance);
  const availableCash = bankBalance + cashBoxBalance;
  const loyaltyPendingBalance = sumBy(data.loyaltyAccounts, (account) => account.moneyBalance);
  const netPosition = availableCash + accountsReceivable - accountsPayable;

  return {
    period,
    summary: {
      totalSales: asMoney(totalSales),
      totalCollected: asMoney(totalCollected),
      totalPurchases: asMoney(totalPurchases),
      totalPaidToSuppliers: asMoney(totalPaidToSuppliers),
      totalExpenses: asMoney(totalExpenses),
      grossProfit: asMoney(grossProfit),
      netProfit: asMoney(netProfit),
      accountsReceivable: asMoney(accountsReceivable),
      accountsPayable: asMoney(accountsPayable),
      bankBalance: asMoney(bankBalance),
      cashBoxBalance: asMoney(cashBoxBalance),
      availableCash: asMoney(availableCash),
      loyaltyPendingBalance: asMoney(loyaltyPendingBalance),
      netPosition: asMoney(netPosition),
      grossMargin: percentage(grossProfit, totalSales),
      netMargin: percentage(netProfit, totalSales)
    },
    counts: {
      invoices: data.invoices.length,
      pendingInvoices: data.receivableInvoices.length,
      purchases: data.purchases.length,
      pendingPurchases: data.payablePurchases.length,
      expenses: data.expenses.length,
      bankAccounts: data.bankAccounts.length,
      cashBoxes: data.cashBoxes.length
    }
  };
};

export const buildCashFlow = (data, start, end) => {
  const movements = [];

  for (const payment of data.payments) {
    movements.push({
      date: payment.paymentDate,
      source: "payment",
      type: "inflow",
      description: `Cobro factura ${payment.invoice?.invoiceNumber || ""}`.trim(),
      reference: payment.reference,
      amount: Number(payment.amount)
    });
  }

  for (const payment of data.purchasePayments) {
    movements.push({
      date: payment.paymentDate,
      source: "supplier_payment",
      type: "outflow",
      description: `Pago compra ${payment.purchase?.purchaseNumber || ""}`.trim(),
      reference: payment.reference,
      amount: Number(payment.amount)
    });
  }

  for (const expense of data.expenses) {
    movements.push({
      date: expense.expenseDate,
      source: "expense",
      type: "outflow",
      description: expense.description,
      reference: expense.reference,
      amount: Number(expense.amount)
    });
  }

  for (const transaction of data.bankTransactions.filter((tx) => isManualBankMovement(tx, data.expenses))) {
    if (transaction.type === "DEPOSIT" || transaction.type === "WITHDRAWAL") {
      movements.push({
        date: transaction.transactionDate,
        source: "bank_manual",
        type: transaction.type === "DEPOSIT" ? "inflow" : "outflow",
        description: transaction.description || transaction.bankAccount?.name || "Movimiento bancario",
        reference: transaction.reference,
        amount: Number(transaction.amount)
      });
    } else {
      movements.push({
        date: transaction.transactionDate,
        source: "bank_transfer",
        type: "neutral",
        description: transaction.description || "Transferencia bancaria",
        reference: transaction.reference,
        amount: Number(transaction.amount)
      });
    }
  }

  for (const transaction of data.cashTransactions.filter((tx) => isManualCashMovement(tx, data.expenses))) {
    movements.push({
      date: transaction.transactionDate,
      source: "cash_manual",
      type: transaction.type === "CASH_IN" ? "inflow" : transaction.type === "CASH_OUT" ? "outflow" : "neutral",
      description: transaction.description || transaction.cashBox?.name || "Movimiento de caja",
      reference: transaction.reference,
      amount: Number(transaction.amount)
    });
  }

  const byMonthMap = initializeMonthMap(start, end);
  for (const movement of movements) {
    const key = monthKey(movement.date);
    const current = byMonthMap.get(key) || { month: key };
    if (movement.type === "inflow") current.inflows = Number(current.inflows || 0) + movement.amount;
    if (movement.type === "outflow") current.outflows = Number(current.outflows || 0) + movement.amount;
    byMonthMap.set(key, current);
  }

  const totalInflows = sumBy(movements.filter((movement) => movement.type === "inflow"), (movement) => movement.amount);
  const totalOutflows = sumBy(movements.filter((movement) => movement.type === "outflow"), (movement) => movement.amount);

  return {
    totalInflows: asMoney(totalInflows),
    totalOutflows: asMoney(totalOutflows),
    netCashFlow: asMoney(totalInflows - totalOutflows),
    byMonth: Array.from(byMonthMap.values()).map((row) => ({
      month: row.month,
      inflows: asMoney(row.inflows || 0),
      outflows: asMoney(row.outflows || 0),
      net: asMoney(Number(row.inflows || 0) - Number(row.outflows || 0))
    })),
    movements: movements
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 50)
      .map((movement) => ({ ...movement, date: dateLabel(movement.date), amount: asMoney(movement.amount) }))
  };
};

export const buildProfitability = (data, start, end) => {
  const sales = sumBy(data.invoices, (invoice) => invoice.total);
  const costOfGoodsSold = getCostOfGoodsSold(data.invoiceItems);
  const expenses = sumBy(data.expenses, (expense) => expense.amount);
  const grossProfit = sales - costOfGoodsSold;
  const netProfit = grossProfit - expenses;

  const byMonthMap = initializeMonthMap(start, end);
  groupByMonth(data.invoices, (invoice) => invoice.createdAt, (invoice) => invoice.total, "sales", byMonthMap);
  groupByMonth(data.invoiceItems, (item) => item.invoice.createdAt, (item) => Number(item.cost) * Number(item.quantity), "costOfGoodsSold", byMonthMap);
  groupByMonth(data.expenses, (expense) => expense.expenseDate, (expense) => expense.amount, "expenses", byMonthMap);

  const byProductMap = new Map();
  for (const item of data.invoiceItems) {
    const current = byProductMap.get(item.productId) || {
      product: item.product?.name || "Producto",
      quantity: 0,
      totalSold: 0,
      cost: 0,
      profit: 0
    };
    current.quantity += Number(item.quantity);
    current.totalSold += Number(item.total);
    current.cost += Number(item.cost) * Number(item.quantity);
    current.profit = current.totalSold - current.cost;
    byProductMap.set(item.productId, current);
  }

  const byClientMap = new Map();
  for (const invoice of data.invoices) {
    const current = byClientMap.get(invoice.clientId) || {
      client: invoice.client?.name || "Cliente",
      totalPurchased: 0,
      totalPaid: 0,
      pendingBalance: 0
    };
    current.totalPurchased += Number(invoice.total);
    current.totalPaid += Number(invoice.paidAmount);
    current.pendingBalance += Number(invoice.balance);
    byClientMap.set(invoice.clientId, current);
  }

  return {
    sales: asMoney(sales),
    costOfGoodsSold: asMoney(costOfGoodsSold),
    grossProfit: asMoney(grossProfit),
    expenses: asMoney(expenses),
    netProfit: asMoney(netProfit),
    grossMargin: percentage(grossProfit, sales),
    netMargin: percentage(netProfit, sales),
    byMonth: Array.from(byMonthMap.values()).map((row) => ({
      month: row.month,
      sales: asMoney(row.sales || 0),
      costOfGoodsSold: asMoney(row.costOfGoodsSold || 0),
      grossProfit: asMoney(Number(row.sales || 0) - Number(row.costOfGoodsSold || 0)),
      expenses: asMoney(row.expenses || 0),
      netProfit: asMoney(Number(row.sales || 0) - Number(row.costOfGoodsSold || 0) - Number(row.expenses || 0))
    })),
    byProduct: sortByValueDesc(Array.from(byProductMap.values()), "profit").slice(0, 10).map(normalizeMoneyFields),
    byClient: sortByValueDesc(Array.from(byClientMap.values()), "totalPurchased").slice(0, 10).map(normalizeMoneyFields)
  };
};

const debtAgeBucket = (date) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 30) return "current";
  if (days <= 60) return "days30";
  if (days <= 90) return "days60";
  if (days <= 120) return "days90";
  return "over90";
};

const buildAging = (rows) => {
  const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  for (const row of rows) {
    aging[debtAgeBucket(row.createdAt)] += Number(row.balance);
  }
  return Object.fromEntries(Object.entries(aging).map(([key, value]) => [key, asMoney(value)]));
};

export const buildDebts = (data) => {
  const clientMap = new Map();
  for (const invoice of data.receivableInvoices) {
    const current = clientMap.get(invoice.clientId) || { client: invoice.client?.name || "Cliente", total: 0, count: 0 };
    current.total += Number(invoice.balance);
    current.count += 1;
    clientMap.set(invoice.clientId, current);
  }

  const supplierMap = new Map();
  for (const purchase of data.payablePurchases) {
    const current = supplierMap.get(purchase.supplierId) || { supplier: purchase.supplier?.name || "Proveedor", total: 0, count: 0 };
    current.total += Number(purchase.balance);
    current.count += 1;
    supplierMap.set(purchase.supplierId, current);
  }

  return {
    receivables: {
      total: asMoney(sumBy(data.receivableInvoices, (invoice) => invoice.balance)),
      count: data.receivableInvoices.length,
      topClients: sortByValueDesc(Array.from(clientMap.values())).slice(0, 10).map(normalizeMoneyFields)
    },
    payables: {
      total: asMoney(sumBy(data.payablePurchases, (purchase) => purchase.balance)),
      count: data.payablePurchases.length,
      topSuppliers: sortByValueDesc(Array.from(supplierMap.values())).slice(0, 10).map(normalizeMoneyFields)
    },
    agingReceivables: buildAging(data.receivableInvoices),
    agingPayables: buildAging(data.payablePurchases)
  };
};

export const buildMonthly = (data, start, end) => {
  const map = initializeMonthMap(start, end);
  groupByMonth(data.invoices, (invoice) => invoice.createdAt, (invoice) => invoice.total, "sales", map);
  groupByMonth(data.invoiceItems, (item) => item.invoice.createdAt, (item) => Number(item.cost) * Number(item.quantity), "costOfGoodsSold", map);
  groupByMonth(data.purchases, (purchase) => purchase.createdAt, (purchase) => purchase.total, "purchases", map);
  groupByMonth(data.expenses, (expense) => expense.expenseDate, (expense) => expense.amount, "expenses", map);
  groupByMonth(data.payments, (payment) => payment.paymentDate, (payment) => payment.amount, "collected", map);
  groupByMonth(data.purchasePayments, (payment) => payment.paymentDate, (payment) => payment.amount, "paid", map);

  return {
    months: Array.from(map.values()).map((row) => {
      const grossProfit = Number(row.sales || 0) - Number(row.costOfGoodsSold || 0);
      const netProfit = grossProfit - Number(row.expenses || 0);
      const cashFlow = Number(row.collected || 0) - Number(row.paid || 0) - Number(row.expenses || 0);
      return {
        month: row.month,
        sales: asMoney(row.sales || 0),
        purchases: asMoney(row.purchases || 0),
        expenses: asMoney(row.expenses || 0),
        grossProfit: asMoney(grossProfit),
        netProfit: asMoney(netProfit),
        collected: asMoney(row.collected || 0),
        paid: asMoney(row.paid || 0),
        cashFlow: asMoney(cashFlow)
      };
    })
  };
};

export const buildExpensesByCategory = (data) => {
  const map = new Map();
  for (const expense of data.expenses) {
    const current = map.get(expense.category) || { category: expense.category, total: 0, count: 0 };
    current.total += Number(expense.amount);
    current.count += 1;
    map.set(expense.category, current);
  }
  return sortByValueDesc(Array.from(map.values()), "total").map(normalizeMoneyFields);
};

export const buildLoyaltySummary = (data) => ({
  pendingBalance: asMoney(sumBy(data.loyaltyAccounts, (account) => account.moneyBalance)),
  totalEarned: asMoney(sumBy(data.loyaltyAccounts, (account) => account.totalEarned)),
  totalRedeemed: asMoney(sumBy(data.loyaltyAccounts, (account) => account.totalRedeemed)),
  redeemedInPeriod: asMoney(sumBy(data.loyaltyTransactions.filter((transaction) => transaction.type === "REDEEMED"), (transaction) => transaction.amount))
});

export const buildAlerts = async (data) => {
  const summary = buildSummary(data, "month").summary;
  const alerts = [];
  const lowStock = data.products.filter((product) => Number(product.stock) <= Number(product.minimumStock));
  const lastBackup = await getLastBackupInfo();
  const backupIsOld = !lastBackup || Date.now() - new Date(lastBackup.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  if (summary.accountsReceivable > Math.max(summary.totalSales * 0.5, 10000)) {
    alerts.push({ type: "accounts_receivable", severity: "warning", title: "Cuentas por cobrar altas", message: "El balance pendiente de clientes requiere seguimiento.", value: summary.accountsReceivable });
  }
  if (summary.accountsPayable > Math.max(summary.availableCash * 0.6, 10000)) {
    alerts.push({ type: "accounts_payable", severity: "warning", title: "Cuentas por pagar altas", message: "Las obligaciones pendientes consumen una parte importante de la liquidez.", value: summary.accountsPayable });
  }
  if (summary.totalExpenses > Math.max(summary.totalSales * 0.35, 10000)) {
    alerts.push({ type: "expenses", severity: "warning", title: "Gastos elevados", message: "Los gastos del periodo estan presionando la rentabilidad.", value: summary.totalExpenses });
  }
  if (summary.netProfit < 0) {
    alerts.push({ type: "net_profit", severity: "danger", title: "Ganancia neta negativa", message: "El periodo cierra con perdida aproximada.", value: summary.netProfit });
  }
  if (summary.availableCash < summary.accountsPayable * 0.25 && summary.accountsPayable > 0) {
    alerts.push({ type: "available_cash", severity: "danger", title: "Bajo efectivo disponible", message: "El efectivo disponible es bajo frente a las cuentas por pagar.", value: summary.availableCash });
  }
  if (lowStock.length > 0) {
    alerts.push({ type: "low_stock", severity: "info", title: "Productos con stock bajo", message: `${lowStock.length} productos pueden impactar ventas futuras.`, value: lowStock.length });
  }
  if (summary.loyaltyPendingBalance > Math.max(summary.totalSales * 0.05, 1000)) {
    alerts.push({ type: "loyalty", severity: "info", title: "Balance de fidelizacion pendiente", message: "Hay credito de fidelizacion acumulado por clientes.", value: summary.loyaltyPendingBalance });
  }
  if (backupIsOld) {
    alerts.push({ type: "backup", severity: "warning", title: "Backup pendiente", message: lastBackup ? "El ultimo backup tiene mas de 7 dias." : "No hay backups registrados.", value: lastBackup?.createdAt || null });
  }
  if (!alerts.length) {
    alerts.push({ type: "healthy", severity: "success", title: "Sin alertas criticas", message: "No se detectaron riesgos financieros relevantes en el periodo.", value: 0 });
  }
  return alerts;
};

export const buildProjections = async (prisma, companyId) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const data = await fetchFinanceDataset(prisma, companyId, start, end);
  const monthly = buildMonthly(data, start, end).months.filter((row) => row.sales > 0 || row.expenses > 0 || row.netProfit !== 0);
  const completeMonths = monthly.slice(-3);

  if (completeMonths.length < 2) {
    return {
      projectedSalesNextMonth: 0,
      projectedExpensesNextMonth: 0,
      projectedNetProfitNextMonth: 0,
      basedOnMonths: completeMonths.length,
      notes: "No hay suficientes datos historicos para proyectar con confianza. Se requieren al menos 2 meses con actividad."
    };
  }

  const projectedSalesNextMonth = sumBy(completeMonths, (row) => row.sales) / completeMonths.length;
  const projectedExpensesNextMonth = sumBy(completeMonths, (row) => row.expenses) / completeMonths.length;
  const projectedNetProfitNextMonth = sumBy(completeMonths, (row) => row.netProfit) / completeMonths.length;

  return {
    projectedSalesNextMonth: asMoney(projectedSalesNextMonth),
    projectedExpensesNextMonth: asMoney(projectedExpensesNextMonth),
    projectedNetProfitNextMonth: asMoney(projectedNetProfitNextMonth),
    basedOnMonths: completeMonths.length,
    notes: "Proyeccion simple basada en el promedio de los ultimos meses con actividad. No sustituye una planificacion financiera formal."
  };
};
