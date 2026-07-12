import prisma from "../prisma.js";
import { sendExcel } from "../utils/excelExport.js";
import { sendReportPdf } from "../utils/pdfGenerator.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { requireCompanyId } from "../utils/companyScope.js";
import { attachFinancialOrigins, financialOriginToText } from "../utils/financialTraceability.js";

const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
const today = () => new Date().toISOString().slice(0, 10);
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
export const MAX_REPORT_RANGE_DAYS = 366;
export const MAX_REPORT_EXPORT_ROWS = 5000;

const reportError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parseDateOnly = (value, label) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw reportError(`${label} debe tener formato YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw reportError(`${label} no es una fecha valida`);
  }
  return date;
};

export const prepareReportQuery = (query = {}) => {
  const startDateValue = parseDateOnly(query.startDate, "La fecha desde");
  const endDateValue = parseDateOnly(query.endDate, "La fecha hasta");
  if (startDateValue && endDateValue) {
    if (startDateValue > endDateValue) {
      throw reportError("La fecha desde no puede ser mayor que la fecha hasta");
    }
    const days = Math.floor((endDateValue - startDateValue) / 86400000) + 1;
    if (days > MAX_REPORT_RANGE_DAYS) {
      throw reportError(`El rango maximo de reportes es de ${MAX_REPORT_RANGE_DAYS} dias`);
    }
  }
  return { ...query, __startDate: startDateValue, __endDate: endDateValue };
};

const dateFilter = (field, query) => {
  const filter = {};
  if (query.__startDate) filter.gte = query.__startDate;
  if (query.__endDate) {
    const end = new Date(query.__endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return Object.keys(filter).length ? { [field]: filter } : {};
};

const intQuery = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const scopedQuery = (req) => prepareReportQuery({ ...req.query, companyId: requireCompanyId(req) });

const reportPagination = (query) => {
  if (query.page === undefined && query.limit === undefined) return null;
  const page = Math.max(Number.parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "25", 10) || 25, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const paginateReportRows = (data, key, query) => {
  const pagination = reportPagination(query);
  if (!pagination) return data;
  const rows = Array.isArray(data[key]) ? data[key] : [];
  return {
    ...data,
    [key]: rows.slice(pagination.skip, pagination.skip + pagination.limit),
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: rows.length,
      totalPages: Math.max(Math.ceil(rows.length / pagination.limit), 1)
    }
  };
};

const reportColumns = {
  sales: [
    { key: "invoiceNumber", header: "Factura" },
    { key: "clientName", header: "Cliente" },
    { key: "createdAt", header: "Fecha" },
    { key: "total", header: "Total" },
    { key: "paidAmount", header: "Pagado" },
    { key: "balance", header: "Balance" },
    { key: "status", header: "Estado" }
  ],
  purchases: [
    { key: "purchaseNumber", header: "Compra" },
    { key: "supplierName", header: "Proveedor" },
    { key: "createdAt", header: "Fecha" },
    { key: "total", header: "Total" },
    { key: "paidAmount", header: "Pagado" },
    { key: "balance", header: "Balance" },
    { key: "status", header: "Estado" }
  ],
  inventory: [
    { key: "code", header: "Codigo" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock" },
    { key: "minimumStock", header: "Minimo" },
    { key: "cost", header: "Costo" },
    { key: "price", header: "Precio" },
    { key: "stockValue", header: "Valor" }
  ],
  expenses: [
    { key: "expenseDate", header: "Fecha" },
    { key: "category", header: "Categoria" },
    { key: "description", header: "Descripcion" },
    { key: "amount", header: "Monto" },
    { key: "paymentSource", header: "Fuente" },
    { key: "reference", header: "Referencia" }
  ],
  bank: [
    { key: "bankAccountName", header: "Cuenta" },
    { key: "type", header: "Tipo" },
    { key: "amount", header: "Monto" },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" },
    { key: "originLabel", header: "Origen" },
    { key: "transactionDate", header: "Fecha" }
  ],
  cashBox: [
    { key: "cashBoxName", header: "Caja" },
    { key: "type", header: "Tipo" },
    { key: "amount", header: "Monto" },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" },
    { key: "originLabel", header: "Origen" },
    { key: "transactionDate", header: "Fecha" }
  ]
};

const getSalesData = async (query) => {
  const clientId = intQuery(query.clientId);
  const where = {
    companyId: query.companyId,
    ...dateFilter("createdAt", query),
    ...(clientId ? { clientId } : {}),
    ...(query.status ? { status: query.status } : {})
  };
  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: { select: { name: true } },
      items: { select: { quantity: true, cost: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  const rows = invoices.map((invoice) => {
    const totalCost = roundMoney(invoice.items.reduce((sum, item) => sum + Number(item.cost) * item.quantity, 0));
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client?.name || "",
      createdAt: invoice.createdAt,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      balance: Number(invoice.balance),
      status: invoice.status,
      totalCost
    };
  });
  const totalSales = roundMoney(rows.reduce((sum, row) => sum + row.total, 0));
  const totalCost = roundMoney(rows.reduce((sum, row) => sum + row.totalCost, 0));
  return { totalSales, totalCost, grossProfit: roundMoney(totalSales - totalCost), countInvoices: rows.length, invoices: rows };
};

const getPurchasesData = async (query) => {
  const supplierId = intQuery(query.supplierId);
  const where = {
    companyId: query.companyId,
    ...dateFilter("createdAt", query),
    ...(supplierId ? { supplierId } : {}),
    ...(query.status ? { status: query.status } : {})
  };
  const purchases = await prisma.purchase.findMany({
    where,
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });
  const rows = purchases.map((purchase) => ({
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    supplierName: purchase.supplier?.name || "",
    createdAt: purchase.createdAt,
    subtotal: Number(purchase.subtotal),
    tax: Number(purchase.tax),
    discount: Number(purchase.discount),
    total: Number(purchase.total),
    paidAmount: Number(purchase.paidAmount),
    balance: Number(purchase.balance),
    status: purchase.status
  }));
  return {
    totalPurchases: roundMoney(rows.reduce((sum, row) => sum + row.total, 0)),
    countPurchases: rows.length,
    totalPaid: roundMoney(rows.reduce((sum, row) => sum + row.paidAmount, 0)),
    totalBalance: roundMoney(rows.reduce((sum, row) => sum + row.balance, 0)),
    purchases: rows
  };
};

const getInventoryData = async (query) => {
  const productId = intQuery(query.productId);
  const lowStock = query.lowStock === "true";
  const products = await prisma.product.findMany({
    where: {
      companyId: query.companyId,
      ...(productId ? { id: productId } : {})
    },
    orderBy: { name: "asc" }
  });
  const productRows = products
    .map((product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      stock: product.stock,
      minimumStock: product.minimumStock,
      cost: Number(product.cost),
      price: Number(product.price),
      stockValue: roundMoney(product.stock * Number(product.cost))
    }))
    .filter((product) => !lowStock || product.stock <= product.minimumStock);

  const movements = await prisma.inventoryMovement.findMany({
    where: {
      companyId: query.companyId,
      ...(productId ? { productId } : {}),
      ...(query.movementType ? { type: query.movementType } : {}),
      ...dateFilter("createdAt", query)
    },
    include: { product: { select: { code: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return {
    totalProducts: productRows.length,
    totalStockValue: roundMoney(productRows.reduce((sum, product) => sum + product.stockValue, 0)),
    lowStockCount: productRows.filter((product) => product.stock <= product.minimumStock).length,
    products: productRows,
    movements: movements.map((movement) => ({
      id: movement.id,
      productName: movement.product?.name || "",
      productCode: movement.product?.code || "",
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt
    }))
  };
};

const getAccountsReceivableData = async (query) => {
  const data = await getSalesData({ ...query, status: query.status || undefined });
  const invoices = data.invoices.filter((invoice) => ["PENDING", "PARTIAL"].includes(invoice.status));
  return {
    totalReceivable: roundMoney(invoices.reduce((sum, invoice) => sum + invoice.balance, 0)),
    countPending: invoices.filter((invoice) => invoice.status === "PENDING").length,
    countPartial: invoices.filter((invoice) => invoice.status === "PARTIAL").length,
    invoices
  };
};

const getAccountsPayableData = async (query) => {
  const data = await getPurchasesData({ ...query, status: query.status || undefined });
  const purchases = data.purchases.filter((purchase) => ["PENDING", "PARTIAL"].includes(purchase.status));
  return {
    totalPayable: roundMoney(purchases.reduce((sum, purchase) => sum + purchase.balance, 0)),
    countPending: purchases.filter((purchase) => purchase.status === "PENDING").length,
    countPartial: purchases.filter((purchase) => purchase.status === "PARTIAL").length,
    purchases
  };
};

const groupBySum = (rows, keyGetter, valueGetter) => {
  return rows.reduce((acc, row) => {
    const key = keyGetter(row);
    acc[key] = roundMoney((acc[key] || 0) + valueGetter(row));
    return acc;
  }, {});
};

const getExpensesData = async (query) => {
  const expenses = await prisma.expense.findMany({
    where: {
      companyId: query.companyId,
      ...dateFilter("expenseDate", query),
      ...(query.category ? { category: query.category } : {}),
      ...(query.paymentSource ? { paymentSource: query.paymentSource } : {})
    },
    orderBy: { expenseDate: "desc" }
  });
  const rows = expenses.map((expense) => ({
    id: expense.id,
    expenseDate: expense.expenseDate,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount),
    paymentSource: expense.paymentSource,
    reference: expense.reference
  }));
  return {
    totalExpenses: roundMoney(rows.reduce((sum, row) => sum + row.amount, 0)),
    expensesByCategory: groupBySum(rows, (row) => row.category, (row) => row.amount),
    expensesByMonth: groupBySum(rows, (row) => row.expenseDate.toISOString().slice(0, 7), (row) => row.amount),
    expenses: rows
  };
};

const getBankData = async (query) => {
  const bankAccountId = intQuery(query.bankAccountId);
  const accounts = await prisma.bankAccount.findMany({ where: { companyId: query.companyId }, orderBy: { name: "asc" } });
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      companyId: query.companyId,
      ...(bankAccountId ? { bankAccountId } : {}),
      ...(query.transactionType ? { type: query.transactionType } : {}),
      ...dateFilter("transactionDate", query)
    },
    include: { bankAccount: { select: { name: true, bankName: true } } },
    orderBy: { transactionDate: "desc" }
  });
  const enrichedTransactions = await attachFinancialOrigins(transactions, { prismaClient: prisma, companyId: query.companyId });
  return {
    totalBankBalance: roundMoney(accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0)),
    accounts,
    transactions: enrichedTransactions.map((tx) => ({
      id: tx.id,
      bankAccountName: `${tx.bankAccount?.bankName || ""} - ${tx.bankAccount?.name || ""}`,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      reference: tx.reference,
      sourceType: tx.sourceType,
      sourceId: tx.sourceId,
      sourceNumber: tx.sourceNumber,
      origin: tx.origin,
      originLabel: financialOriginToText(tx.origin),
      transactionDate: tx.transactionDate
    }))
  };
};

const getCashBoxData = async (query) => {
  const cashBoxId = intQuery(query.cashBoxId);
  const cashBoxes = await prisma.cashBox.findMany({ where: { companyId: query.companyId }, orderBy: { name: "asc" } });
  const transactions = await prisma.cashTransaction.findMany({
    where: {
      companyId: query.companyId,
      ...(cashBoxId ? { cashBoxId } : {}),
      ...(query.transactionType ? { type: query.transactionType } : {}),
      ...dateFilter("transactionDate", query)
    },
    include: { cashBox: { select: { name: true } } },
    orderBy: { transactionDate: "desc" }
  });
  const enrichedTransactions = await attachFinancialOrigins(transactions, { prismaClient: prisma, companyId: query.companyId });
  return {
    totalCashBoxBalance: roundMoney(cashBoxes.reduce((sum, box) => sum + Number(box.currentBalance), 0)),
    cashBoxes,
    transactions: enrichedTransactions.map((tx) => ({
      id: tx.id,
      cashBoxName: tx.cashBox?.name || "",
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      reference: tx.reference,
      sourceType: tx.sourceType,
      sourceId: tx.sourceId,
      sourceNumber: tx.sourceNumber,
      origin: tx.origin,
      originLabel: financialOriginToText(tx.origin),
      transactionDate: tx.transactionDate
    }))
  };
};

const summarizeAccountingByAccount = async (query) => {
  const lines = await prisma.accountingEntryLine.findMany({
    where: { companyId: query.companyId, entry: { status: "POSTED", companyId: query.companyId } },
    include: { account: { select: { code: true, name: true, type: true } } },
    orderBy: { account: { code: "asc" } }
  });
  const map = new Map();
  for (const line of lines) {
    const row = map.get(line.accountId) || { code: line.account.code, name: line.account.name, type: line.account.type, totalDebit: 0, totalCredit: 0, balance: 0 };
    row.totalDebit = roundMoney(row.totalDebit + Number(line.debit));
    row.totalCredit = roundMoney(row.totalCredit + Number(line.credit));
    row.balance = roundMoney(row.totalDebit - row.totalCredit);
    map.set(line.accountId, row);
  }
  return [...map.values()];
};

const getAccountingData = async (query) => {
  const trialBalance = await summarizeAccountingByAccount(query);
  const totalIncome = roundMoney(trialBalance.filter((row) => row.type === "INCOME").reduce((sum, row) => sum + row.totalCredit - row.totalDebit, 0));
  const totalExpenses = roundMoney(trialBalance.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + row.totalDebit - row.totalCredit, 0));
  const typeTotal = (type) => roundMoney(trialBalance.filter((row) => row.type === type).reduce((sum, row) => sum + (["LIABILITY", "EQUITY", "INCOME"].includes(type) ? row.totalCredit - row.totalDebit : row.totalDebit - row.totalCredit), 0));
  return {
    trialBalance,
    incomeStatement: { totalIncome, totalExpenses, netResult: roundMoney(totalIncome - totalExpenses) },
    accountSummary: {
      totalAssets: typeTotal("ASSET"),
      totalLiabilities: typeTotal("LIABILITY"),
      totalEquity: typeTotal("EQUITY"),
      totalIncome: typeTotal("INCOME"),
      totalExpenses: typeTotal("EXPENSE")
    }
  };
};

const reportMap = {
  sales: { title: "Reporte de ventas", getData: getSalesData, rows: (data) => data.invoices, columns: reportColumns.sales, totals: (data) => ({ totalSales: data.totalSales, totalCost: data.totalCost, grossProfit: data.grossProfit, countInvoices: data.countInvoices }) },
  purchases: { title: "Reporte de compras", getData: getPurchasesData, rows: (data) => data.purchases, columns: reportColumns.purchases, totals: (data) => ({ totalPurchases: data.totalPurchases, totalPaid: data.totalPaid, totalBalance: data.totalBalance, countPurchases: data.countPurchases }) },
  inventory: { title: "Reporte de inventario", getData: getInventoryData, rows: (data) => data.products, columns: reportColumns.inventory, totals: (data) => ({ totalProducts: data.totalProducts, totalStockValue: data.totalStockValue, lowStockCount: data.lowStockCount }) },
  "accounts-receivable": { title: "Reporte de cuentas por cobrar", getData: getAccountsReceivableData, rows: (data) => data.invoices, columns: reportColumns.sales, totals: (data) => ({ totalReceivable: data.totalReceivable, countPending: data.countPending, countPartial: data.countPartial }) },
  "accounts-payable": { title: "Reporte de cuentas por pagar", getData: getAccountsPayableData, rows: (data) => data.purchases, columns: reportColumns.purchases, totals: (data) => ({ totalPayable: data.totalPayable, countPending: data.countPending, countPartial: data.countPartial }) },
  expenses: { title: "Reporte de gastos", getData: getExpensesData, rows: (data) => data.expenses, columns: reportColumns.expenses, totals: (data) => ({ totalExpenses: data.totalExpenses }) },
  bank: { title: "Reporte de banco", getData: getBankData, rows: (data) => data.transactions, columns: reportColumns.bank, totals: (data) => ({ totalBankBalance: data.totalBankBalance }) },
  "cash-box": { title: "Reporte de caja chica", getData: getCashBoxData, rows: (data) => data.transactions, columns: reportColumns.cashBox, totals: (data) => ({ totalCashBoxBalance: data.totalCashBoxBalance }) }
};

const sendReport = async (req, res, reportName, format) => {
  const config = reportMap[reportName];
  const data = await config.getData(scopedQuery(req));
  const rows = config.rows(data);
  if (rows.length > MAX_REPORT_EXPORT_ROWS) {
    throw reportError(`El reporte tiene ${rows.length} filas. Aplica filtros de fecha u otros filtros para exportar maximo ${MAX_REPORT_EXPORT_ROWS} filas.`, 413);
  }
  const totals = config.totals(data);
  const filename = `reporte_${reportName.replaceAll("-", "_")}_${today()}.${format === "excel" ? "xlsx" : "pdf"}`;
  if (format === "excel") return sendExcel(res, { filename, title: config.title, filters: req.query, totals, rows });
  const companyId = requireCompanyId(req);
  const [company, documentSettings] = await Promise.all([prisma.companySetting.findFirst({ where: { companyId } }), prisma.documentSetting.findFirst({ where: { companyId } })]);
  return sendReportPdf(res, { filename, title: config.title, filters: req.query, totals, rows, columns: config.columns, company, documentSettings });
};

export const salesReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getSalesData(query), "invoices", query)); } catch (error) { next(error); }
};
export const purchasesReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getPurchasesData(query), "purchases", query)); } catch (error) { next(error); }
};
export const inventoryReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getInventoryData(query), "products", query)); } catch (error) { next(error); }
};
export const accountsReceivableReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getAccountsReceivableData(query), "invoices", query)); } catch (error) { next(error); }
};
export const accountsPayableReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getAccountsPayableData(query), "purchases", query)); } catch (error) { next(error); }
};
export const expensesReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getExpensesData(query), "expenses", query)); } catch (error) { next(error); }
};
export const bankReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getBankData(query), "transactions", query)); } catch (error) { next(error); }
};
export const cashBoxReport = async (req, res, next) => {
  try { const query = scopedQuery(req); res.json(paginateReportRows(await getCashBoxData(query), "transactions", query)); } catch (error) { next(error); }
};
export const accountingReport = async (req, res, next) => {
  try { res.json(await getAccountingData(scopedQuery(req))); } catch (error) { next(error); }
};
export const summaryReport = async (req, res, next) => {
  try {
    const [sales, purchases, inventory, receivable, payable, expenses, bank, cashBox, accounting] = await Promise.all([
      getSalesData(scopedQuery(req)),
      getPurchasesData(scopedQuery(req)),
      getInventoryData(scopedQuery(req)),
      getAccountsReceivableData(scopedQuery(req)),
      getAccountsPayableData(scopedQuery(req)),
      getExpensesData(scopedQuery(req)),
      getBankData(scopedQuery(req)),
      getCashBoxData(scopedQuery(req)),
      getAccountingData(scopedQuery(req))
    ]);
    res.json({ sales, purchases, inventory, receivable, payable, expenses, bank, cashBox, accounting });
  } catch (error) {
    next(error);
  }
};

export const exportReport = (reportName, format) => async (req, res, next) => {
  try {
    await createAuditLog({ action: "REPORT_EXPORTED", module: "REPORTES", entityType: "Report", entityId: reportName, description: `Reporte exportado en ${format}: ${reportName}`, req });
    await sendReport(req, res, reportName, format);
  } catch (error) {
    next(error);
  }
};

export const exportAccountingReport = (format) => async (req, res, next) => {
  try {
    await createAuditLog({ action: "REPORT_EXPORTED", module: "REPORTES", entityType: "Report", entityId: "accounting", description: `Reporte contable exportado en ${format}`, req });
    const data = await getAccountingData(scopedQuery(req));
    const filename = `reporte_contabilidad_${today()}.${format === "excel" ? "xlsx" : "pdf"}`;
    const totals = { ...data.incomeStatement, ...data.accountSummary };
    if (format === "excel") return sendExcel(res, { filename, title: "Reporte de contabilidad", totals, rows: data.trialBalance });
    const companyId = requireCompanyId(req);
    const [company, documentSettings] = await Promise.all([prisma.companySetting.findFirst({ where: { companyId } }), prisma.documentSetting.findFirst({ where: { companyId } })]);
    return sendReportPdf(res, {
      filename,
      title: "Reporte de contabilidad",
      totals,
      columns: [
        { key: "code", header: "Codigo" },
        { key: "name", header: "Cuenta" },
        { key: "type", header: "Tipo" },
        { key: "totalDebit", header: "Debito" },
        { key: "totalCredit", header: "Credito" },
        { key: "balance", header: "Balance" }
      ],
      rows: data.trialBalance,
      company,
      documentSettings
    });
  } catch (error) {
    next(error);
  }
};

export const formatCurrency = (value) => money.format(Number(value || 0));
