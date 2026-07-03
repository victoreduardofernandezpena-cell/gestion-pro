import prisma from "../prisma.js";

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [clientsCount, productsCount, products, activeInvoices, receivableInvoices, invoiceItems, bankAccounts, cashBoxes, expenses, payablePurchases] = await Promise.all([
      prisma.client.count(),
      prisma.product.count(),
      prisma.product.findMany({ select: { stock: true, minimumStock: true } }),
      prisma.invoice.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true }
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["PENDING", "PARTIAL"] } },
        select: { balance: true }
      }),
      prisma.invoiceItem.findMany({
        where: { invoice: { status: { not: "CANCELLED" } } },
        select: { quantity: true, cost: true, invoice: { select: { createdAt: true } } }
      }),
      prisma.bankAccount.findMany({ where: { isActive: true }, select: { currentBalance: true } }),
      prisma.cashBox.findMany({ where: { isActive: true }, select: { currentBalance: true } }),
      prisma.expense.findMany({ select: { amount: true } }),
      prisma.purchase.findMany({ where: { status: { in: ["PENDING", "PARTIAL"] } }, select: { balance: true } })
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
