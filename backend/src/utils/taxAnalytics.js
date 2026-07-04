import { roundMoney, sumBy } from "./dashboardAnalytics.js";

const VALID_PERIODS = ["today", "week", "month", "quarter", "year", "custom"];
const VALID_STATUSES = ["PENDING", "PARTIAL", "PAID", "CANCELLED"];

export const resolveTaxRange = ({ period = "month", startDate, endDate } = {}) => {
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

export const monthKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
};

const money = (value) => roundMoney(value);

const dateOnly = (date) => new Date(date).toISOString().slice(0, 10);

const initializeMonthMap = (start, end) => {
  const map = new Map();
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const key = monthKey(cursor);
    map.set(key, {
      month: key,
      salesTaxCollected: 0,
      purchaseTaxPaid: 0,
      netTax: 0,
      taxableSales: 0,
      taxablePurchases: 0,
      expenses: 0
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return map;
};

export const fetchTaxDataset = async (prisma, companyId, start, end, query = {}) => {
  const invoiceWhere = { companyId, createdAt: { gte: start, lte: end } };
  const purchaseWhere = { companyId, createdAt: { gte: start, lte: end } };
  const status = typeof query.status === "string" ? query.status.toUpperCase() : "";

  if (status && VALID_STATUSES.includes(status)) {
    invoiceWhere.status = status;
    purchaseWhere.status = status;
  } else {
    invoiceWhere.status = { not: "CANCELLED" };
    purchaseWhere.status = { not: "CANCELLED" };
  }

  const [invoices, purchases, expenses, companySetting, defaultTaxSetting] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true, rnc: true } } }
    }),
    prisma.purchase.findMany({
      where: purchaseWhere,
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { id: true, name: true, rnc: true } } }
    }),
    prisma.expense.findMany({
      where: { companyId, expenseDate: { gte: start, lte: end } },
      orderBy: { expenseDate: "desc" }
    }),
    prisma.companySetting.findUnique({ where: { companyId } }).catch(() => null),
    prisma.taxSetting.findFirst({ where: { companyId, isDefault: true, isActive: true } }).catch(() => null)
  ]);

  return { invoices, purchases, expenses, companySetting, defaultTaxSetting };
};

export const buildTaxSummary = (data, period) => {
  const taxableSales = sumBy(data.invoices, (invoice) => invoice.subtotal);
  const salesTaxCollected = sumBy(data.invoices, (invoice) => invoice.tax);
  const taxablePurchases = sumBy(data.purchases, (purchase) => purchase.subtotal);
  const purchaseTaxPaid = sumBy(data.purchases, (purchase) => purchase.tax);
  const expensesTotal = sumBy(data.expenses, (expense) => expense.amount);
  const netTax = salesTaxCollected - purchaseTaxPaid;

  return {
    period,
    summary: {
      taxableSales: money(taxableSales),
      salesTaxCollected: money(salesTaxCollected),
      taxablePurchases: money(taxablePurchases),
      purchaseTaxPaid: money(purchaseTaxPaid),
      expensesTotal: money(expensesTotal),
      estimatedTaxPayable: netTax > 0 ? money(netTax) : 0,
      estimatedTaxCredit: netTax < 0 ? money(Math.abs(netTax)) : 0,
      netTax: money(netTax),
      invoiceCount: data.invoices.length,
      purchaseCount: data.purchases.length,
      expenseCount: data.expenses.length
    }
  };
};

export const serializeTaxSales = (invoices) => invoices.map((invoice) => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNumber,
  client: invoice.client?.name || "Cliente",
  date: dateOnly(invoice.createdAt),
  subtotal: money(invoice.subtotal),
  tax: money(invoice.tax),
  total: money(invoice.total),
  status: invoice.status
}));

export const serializeTaxPurchases = (purchases) => purchases.map((purchase) => ({
  id: purchase.id,
  purchaseNumber: purchase.purchaseNumber,
  supplier: purchase.supplier?.name || "Proveedor",
  date: dateOnly(purchase.createdAt),
  subtotal: money(purchase.subtotal),
  tax: money(purchase.tax),
  total: money(purchase.total),
  status: purchase.status
}));

export const serializeTaxExpenses = (expenses) => expenses.map((expense) => ({
  id: expense.id,
  expenseDate: dateOnly(expense.expenseDate),
  category: expense.category,
  description: expense.description,
  amount: money(expense.amount),
  paymentSource: expense.paymentSource,
  reference: expense.reference
}));

export const buildTaxMonthly = (data, start, end) => {
  const map = initializeMonthMap(start, end);

  for (const invoice of data.invoices) {
    const key = monthKey(invoice.createdAt);
    const current = map.get(key) || initializeMonthMap(new Date(invoice.createdAt), new Date(invoice.createdAt)).get(key);
    current.salesTaxCollected += Number(invoice.tax || 0);
    current.taxableSales += Number(invoice.subtotal || 0);
    current.netTax = current.salesTaxCollected - current.purchaseTaxPaid;
    map.set(key, current);
  }

  for (const purchase of data.purchases) {
    const key = monthKey(purchase.createdAt);
    const current = map.get(key) || initializeMonthMap(new Date(purchase.createdAt), new Date(purchase.createdAt)).get(key);
    current.purchaseTaxPaid += Number(purchase.tax || 0);
    current.taxablePurchases += Number(purchase.subtotal || 0);
    current.netTax = current.salesTaxCollected - current.purchaseTaxPaid;
    map.set(key, current);
  }

  for (const expense of data.expenses) {
    const key = monthKey(expense.expenseDate);
    const current = map.get(key) || initializeMonthMap(new Date(expense.expenseDate), new Date(expense.expenseDate)).get(key);
    current.expenses += Number(expense.amount || 0);
    map.set(key, current);
  }

  return {
    months: Array.from(map.values()).map((row) => ({
      month: row.month,
      salesTaxCollected: money(row.salesTaxCollected),
      purchaseTaxPaid: money(row.purchaseTaxPaid),
      netTax: money(row.salesTaxCollected - row.purchaseTaxPaid),
      taxableSales: money(row.taxableSales),
      taxablePurchases: money(row.taxablePurchases),
      expenses: money(row.expenses)
    }))
  };
};

export const buildItbis = (data, start, end) => {
  const monthly = buildTaxMonthly(data, start, end).months;
  const salesTaxCollected = sumBy(data.invoices, (invoice) => invoice.tax);
  const purchaseTaxPaid = sumBy(data.purchases, (purchase) => purchase.tax);
  const net = salesTaxCollected - purchaseTaxPaid;

  return {
    collected: {
      total: money(salesTaxCollected),
      byMonth: monthly.map((row) => ({ month: row.month, total: row.salesTaxCollected })),
      invoices: serializeTaxSales(data.invoices)
    },
    paid: {
      total: money(purchaseTaxPaid),
      byMonth: monthly.map((row) => ({ month: row.month, total: row.purchaseTaxPaid })),
      purchases: serializeTaxPurchases(data.purchases)
    },
    net: {
      amount: money(net),
      status: net > 0 ? "TO_PAY" : net < 0 ? "CREDIT" : "ZERO"
    }
  };
};

export const buildTaxCompany = (data, reqCompany = {}) => ({
  businessName: data.companySetting?.businessName || reqCompany.name || reqCompany.tradeName || "Empresa",
  tradeName: data.companySetting?.tradeName || reqCompany.tradeName || null,
  rnc: data.companySetting?.rnc || null,
  currencySymbol: data.companySetting?.currencySymbol || "RD$",
  defaultTaxRate: money(data.defaultTaxSetting?.rate ?? data.companySetting?.defaultTaxRate ?? 0),
  hasDefaultTaxSetting: Boolean(data.defaultTaxSetting || data.companySetting?.defaultTaxRate)
});

export const buildTaxReport = (data, period, start, end, reqCompany) => ({
  company: buildTaxCompany(data, reqCompany),
  period: { type: period, startDate: start, endDate: end },
  ...buildTaxSummary(data, period),
  sales: serializeTaxSales(data.invoices),
  purchases: serializeTaxPurchases(data.purchases),
  expenses: {
    expensesTaxSeparated: false,
    items: serializeTaxExpenses(data.expenses)
  },
  monthly: buildTaxMonthly(data, start, end).months
});

export const buildTaxAlerts = (data, period) => {
  const summary = buildTaxSummary(data, period).summary;
  const alerts = [];
  const zeroTaxInvoices = data.invoices.filter((invoice) => Number(invoice.tax || 0) === 0);
  const zeroTaxPurchases = data.purchases.filter((purchase) => Number(purchase.tax || 0) === 0);

  if (summary.estimatedTaxPayable > Math.max(summary.salesTaxCollected * 0.5, 10000)) {
    alerts.push({
      type: "tax_payable_high",
      severity: "warning",
      title: "ITBIS estimado a pagar alto",
      message: "El ITBIS cobrado supera considerablemente el ITBIS pagado en compras.",
      value: summary.estimatedTaxPayable
    });
  }

  if (summary.salesTaxCollected > 0 && summary.purchaseTaxPaid === 0) {
    alerts.push({
      type: "no_purchase_tax",
      severity: "warning",
      title: "Sin compras para compensar ITBIS",
      message: "Hay ITBIS cobrado, pero no hay ITBIS pagado en compras dentro del periodo.",
      value: summary.salesTaxCollected
    });
  }

  if (zeroTaxInvoices.length > 0) {
    alerts.push({
      type: "zero_tax_invoices",
      severity: "info",
      title: "Facturas con ITBIS en cero",
      message: `${zeroTaxInvoices.length} facturas no tienen impuesto registrado.`,
      value: zeroTaxInvoices.length
    });
  }

  if (zeroTaxPurchases.length > 0) {
    alerts.push({
      type: "zero_tax_purchases",
      severity: "info",
      title: "Compras con ITBIS en cero",
      message: `${zeroTaxPurchases.length} compras no tienen impuesto registrado.`,
      value: zeroTaxPurchases.length
    });
  }

  if (!data.defaultTaxSetting && !data.companySetting?.defaultTaxRate) {
    alerts.push({
      type: "missing_default_tax",
      severity: "warning",
      title: "Sin impuesto default configurado",
      message: "No se encontro una tasa default activa para la compania.",
      value: 0
    });
  }

  if (!summary.invoiceCount && !summary.purchaseCount && !summary.expenseCount) {
    alerts.push({
      type: "no_tax_data",
      severity: "info",
      title: "Sin datos fiscales",
      message: "El periodo seleccionado no tiene facturas, compras ni gastos.",
      value: 0
    });
  }

  if (!alerts.length) {
    alerts.push({
      type: "tax_ok",
      severity: "success",
      title: "Sin alertas fiscales criticas",
      message: "No se detectaron riesgos fiscales relevantes en este periodo.",
      value: 0
    });
  }

  return alerts;
};
