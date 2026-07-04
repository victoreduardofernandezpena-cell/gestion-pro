import prisma from "../prisma.js";
import { getLastBackupInfo, monthKey, resolveDashboardRange, roundMoney, sumBy } from "../utils/dashboardAnalytics.js";
import { requireCompanyId } from "../utils/companyScope.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const [clientsCount, productsCount, products, activeInvoices, receivableInvoices, invoiceItems, bankAccounts, cashBoxes, expenses, payablePurchases] = await Promise.all([
      prisma.client.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId } }),
      prisma.product.findMany({ where: { companyId }, select: { stock: true, minimumStock: true } }),
      prisma.invoice.findMany({
        where: { companyId, status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true }
      }),
      prisma.invoice.findMany({
        where: { companyId, status: { in: ["PENDING", "PARTIAL"] } },
        select: { balance: true }
      }),
      prisma.invoiceItem.findMany({
        where: { invoice: { companyId, status: { not: "CANCELLED" } } },
        select: { quantity: true, cost: true, invoice: { select: { createdAt: true } } }
      }),
      prisma.bankAccount.findMany({ where: { companyId, isActive: true }, select: { currentBalance: true } }),
      prisma.cashBox.findMany({ where: { companyId, isActive: true }, select: { currentBalance: true } }),
      prisma.expense.findMany({ where: { companyId }, select: { amount: true } }),
      prisma.purchase.findMany({ where: { companyId, status: { in: ["PENDING", "PARTIAL"] } }, select: { balance: true } })
    ]);

    const lowStockProducts = products.filter((product) => product.stock <= product.minimumStock).length;
    const sales = activeInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const receivables = receivableInvoices.reduce((sum, invoice) => sum + Number(invoice.balance), 0);
    const costs = invoiceItems.reduce((sum, item) => sum + item.quantity * Number(item.cost), 0);
    const profit = sales - costs;
    const bankCash = bankAccounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);
    const pettyCash = cashBoxes.reduce((sum, box) => sum + Number(box.currentBalance), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const payables = payablePurchases.reduce((sum, purchase) => sum + Number(purchase.balance), 0);

    const chartMap = new Map();
    for (const invoice of activeInvoices) {
      const key = invoice.createdAt.toLocaleDateString("es-DO", { weekday: "short" });
      const current = chartMap.get(key) || { label: key, venta: 0, costo: 0, ganancia: 0 };
      current.venta += Number(invoice.total);
      chartMap.set(key, current);
    }
    for (const item of invoiceItems) {
      const key = item.invoice.createdAt.toLocaleDateString("es-DO", { weekday: "short" });
      const current = chartMap.get(key) || { label: key, venta: 0, costo: 0, ganancia: 0 };
      current.costo += item.quantity * Number(item.cost);
      chartMap.set(key, current);
    }

    const chart = Array.from(chartMap.values()).map((item) => ({
      ...item,
      ganancia: item.venta - item.costo
    }));

    res.json({
      period: "Semanal",
      totals: {
        bankCash,
        pettyCash,
        receivables,
        payables,
        sales,
        costs,
        profit,
        expenses: totalExpenses,
        clients: clientsCount,
        products: productsCount,
        lowStockProducts
      },
      chart: chart.length > 0 ? chart : [
        { label: "Lun", venta: 82000, costo: 51000, ganancia: 31000 },
        { label: "Mar", venta: 96000, costo: 60000, ganancia: 36000 },
        { label: "Mie", venta: 88000, costo: 54000, ganancia: 34000 },
        { label: "Jue", venta: 124000, costo: 71000, ganancia: 53000 },
        { label: "Vie", venta: 137000, costo: 83000, ganancia: 54000 },
        { label: "Sab", venta: 97800, costo: 63100, ganancia: 34700 }
      ]
    });
  } catch (error) {
    next(error);
  }
};

export const getAdvancedDashboard = async (req, res, next) => {
  try {
    const { period, start, end } = resolveDashboardRange(req.query);
    const companyId = requireCompanyId(req);
    const range = { gte: start, lte: end };
    const inRange = { createdAt: range };

    const [
      invoices,
      invoiceItems,
      purchases,
      expenses,
      products,
      clientsCount,
      productsCount,
      bankAccounts,
      cashBoxes,
      activeLoyaltyAccounts,
      activeUsers,
      recentInvoices,
      recentPurchases,
      recentExpenses,
      recentInventoryMovements,
      recentPayments,
      recentPurchasePayments,
      recentLoyaltyTransactions,
      recentAuditLogs,
      lastBackup
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: { companyId, status: { not: "CANCELLED" }, ...inRange },
        include: { client: { select: { id: true, name: true } } }
      }),
      prisma.invoiceItem.findMany({
        where: { invoice: { companyId, status: { not: "CANCELLED" }, createdAt: range } },
        include: { product: { select: { id: true, code: true, name: true } }, invoice: { select: { id: true, clientId: true, createdAt: true, client: { select: { name: true } } } } }
      }),
      prisma.purchase.findMany({ where: { companyId, status: { not: "CANCELLED" }, ...inRange }, include: { supplier: { select: { name: true } } } }),
      prisma.expense.findMany({ where: { companyId, createdAt: range } }),
      prisma.product.findMany({ where: { companyId }, select: { id: true, code: true, name: true, stock: true, minimumStock: true } }),
      prisma.client.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId } }),
      prisma.bankAccount.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, currentBalance: true } }),
      prisma.cashBox.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true, currentBalance: true } }),
      prisma.loyaltyAccount.findMany({ where: { companyId, isActive: true }, select: { id: true, client: { select: { name: true } }, moneyBalance: true, totalEarned: true, totalRedeemed: true } }).catch(() => []),
      prisma.userCompany.count({ where: { companyId, isActive: true } }).catch(() => 0),
      prisma.invoice.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { client: { select: { name: true } } } }),
      prisma.purchase.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { supplier: { select: { name: true } } } }),
      prisma.expense.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.inventoryMovement.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { product: { select: { name: true, code: true } } } }),
      prisma.payment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { invoice: { select: { invoiceNumber: true, client: { select: { name: true } } } } } }),
      prisma.purchasePayment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { purchase: { select: { purchaseNumber: true, supplier: { select: { name: true } } } } } }),
      prisma.loyaltyTransaction.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { client: { select: { name: true } }, invoice: { select: { invoiceNumber: true } } } }).catch(() => []),
      req.user?.role === "admin" ? prisma.auditLog.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } }) : [],
      getLastBackupInfo()
    ]);

    const receivableInvoices = await prisma.invoice.findMany({ where: { companyId, status: { in: ["PENDING", "PARTIAL"] } }, select: { id: true, invoiceNumber: true, balance: true, client: { select: { name: true } }, createdAt: true } });
    const payablePurchases = await prisma.purchase.findMany({ where: { companyId, status: { in: ["PENDING", "PARTIAL"] } }, select: { id: true, purchaseNumber: true, balance: true, supplier: { select: { name: true } }, createdAt: true } });

    const totalSales = sumBy(invoices, (invoice) => invoice.total);
    const totalPurchases = sumBy(purchases, (purchase) => purchase.total);
    const totalCosts = sumBy(invoiceItems, (item) => Number(item.cost) * Number(item.quantity));
    const grossProfit = totalSales - totalCosts;
    const totalExpenses = sumBy(expenses, (expense) => expense.amount);
    const netProfit = grossProfit - totalExpenses;
    const accountsReceivable = sumBy(receivableInvoices, (invoice) => invoice.balance);
    const accountsPayable = sumBy(payablePurchases, (purchase) => purchase.balance);
    const bankBalance = sumBy(bankAccounts, (account) => account.currentBalance);
    const cashBoxBalance = sumBy(cashBoxes, (box) => box.currentBalance);
    const loyaltyPendingBalance = sumBy(activeLoyaltyAccounts, (account) => account.moneyBalance);
    const lowStock = products.filter((product) => product.stock <= product.minimumStock);

    const monthly = new Map();
    for (const invoice of invoices) {
      const key = monthKey(invoice.createdAt);
      const current = monthly.get(key) || { label: key, sales: 0, purchases: 0, costs: 0, expenses: 0, profit: 0 };
      current.sales += Number(invoice.total);
      monthly.set(key, current);
    }
    for (const item of invoiceItems) {
      const key = monthKey(item.invoice.createdAt);
      const current = monthly.get(key) || { label: key, sales: 0, purchases: 0, costs: 0, expenses: 0, profit: 0 };
      current.costs += Number(item.cost) * Number(item.quantity);
      monthly.set(key, current);
    }
    for (const purchase of purchases) {
      const key = monthKey(purchase.createdAt);
      const current = monthly.get(key) || { label: key, sales: 0, purchases: 0, costs: 0, expenses: 0, profit: 0 };
      current.purchases += Number(purchase.total);
      monthly.set(key, current);
    }
    for (const expense of expenses) {
      const key = monthKey(expense.createdAt);
      const current = monthly.get(key) || { label: key, sales: 0, purchases: 0, costs: 0, expenses: 0, profit: 0 };
      current.expenses += Number(expense.amount);
      monthly.set(key, current);
    }
    const monthlyData = Array.from(monthly.values()).sort((a, b) => a.label.localeCompare(b.label)).map((row) => ({ ...row, profit: roundMoney(row.sales - row.costs - row.expenses) }));

    const expensesByCategory = Array.from(expenses.reduce((map, expense) => {
      const current = map.get(expense.category) || { name: expense.category, value: 0 };
      current.value += Number(expense.amount);
      map.set(expense.category, current);
      return map;
    }, new Map()).values()).map((row) => ({ ...row, value: roundMoney(row.value) }));

    const productMap = new Map();
    for (const item of invoiceItems) {
      const current = productMap.get(item.productId) || { name: item.product?.name || "Producto", quantity: 0, total: 0 };
      current.quantity += Number(item.quantity);
      current.total += Number(item.total);
      productMap.set(item.productId, current);
    }
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);

    const clientMap = new Map();
    for (const invoice of invoices) {
      const current = clientMap.get(invoice.clientId) || { name: invoice.client?.name || "Cliente", total: 0, invoices: 0 };
      current.total += Number(invoice.total);
      current.invoices += 1;
      clientMap.set(invoice.clientId, current);
    }
    const topClients = Array.from(clientMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);

    const loyaltyEarned = sumBy(recentLoyaltyTransactions.filter((item) => item.type === "EARNED"), (item) => item.amount);
    const loyaltyRedeemed = sumBy(recentLoyaltyTransactions.filter((item) => item.type === "REDEEMED"), (item) => item.amount);
    const backupOld = !lastBackup || Date.now() - new Date(lastBackup.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

    res.json({
      period,
      range: { startDate: start, endDate: end },
      summary: {
        totalSales: roundMoney(totalSales),
        totalPurchases: roundMoney(totalPurchases),
        grossProfit: roundMoney(grossProfit),
        totalExpenses: roundMoney(totalExpenses),
        netProfit: roundMoney(netProfit),
        accountsReceivable: roundMoney(accountsReceivable),
        accountsPayable: roundMoney(accountsPayable),
        bankBalance: roundMoney(bankBalance),
        cashBoxBalance: roundMoney(cashBoxBalance),
        loyaltyPendingBalance: roundMoney(loyaltyPendingBalance),
        totalClients: clientsCount,
        totalProducts: productsCount,
        lowStockProducts: lowStock.length,
        pendingInvoices: receivableInvoices.length,
        pendingPurchases: payablePurchases.length,
        activeLoyaltyClients: activeLoyaltyAccounts.length,
        activeUsers
      },
      charts: {
        salesVsPurchasesByMonth: monthlyData,
        profitByMonth: monthlyData,
        expensesByCategory,
        topProducts,
        topClients,
        receivableVsPayable: [
          { name: "Por cobrar", value: roundMoney(accountsReceivable) },
          { name: "Por pagar", value: roundMoney(accountsPayable) }
        ],
        cashFlow: [
          { name: "Banco", value: roundMoney(bankBalance) },
          { name: "Caja chica", value: roundMoney(cashBoxBalance) }
        ],
        loyaltyEarnedVsRedeemed: [
          { name: "Ganado", value: roundMoney(sumBy(activeLoyaltyAccounts, (account) => account.totalEarned) || loyaltyEarned) },
          { name: "Usado", value: roundMoney(sumBy(activeLoyaltyAccounts, (account) => account.totalRedeemed) || loyaltyRedeemed) }
        ]
      },
      recentActivity: {
        invoices: recentInvoices,
        purchases: recentPurchases,
        expenses: recentExpenses,
        inventoryMovements: recentInventoryMovements,
        receivedPayments: recentPayments,
        supplierPayments: recentPurchasePayments,
        loyaltyTransactions: recentLoyaltyTransactions,
        auditLogs: recentAuditLogs
      },
      alerts: {
        lowStock: lowStock.slice(0, 8),
        pendingInvoices: receivableInvoices.slice(0, 8),
        pendingPurchases: payablePurchases.slice(0, 8),
        highReceivables: receivableInvoices.filter((invoice) => Number(invoice.balance) >= 10000).slice(0, 8),
        highExpenses: expenses.filter((expense) => Number(expense.amount) >= 10000).slice(0, 8),
        backupWarning: backupOld ? { message: lastBackup ? "El ultimo backup tiene mas de 7 dias" : "No hay backups registrados", lastBackup } : null,
        loyaltyBalances: activeLoyaltyAccounts.filter((account) => Number(account.moneyBalance) >= 1000).slice(0, 8)
      }
    });
  } catch (error) {
    next(error);
  }
};
