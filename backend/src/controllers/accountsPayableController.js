import prisma from "../prisma.js";
import { requireCompanyId } from "../utils/companyScope.js";

export const listAccountsPayable = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { companyId: requireCompanyId(req), status: { in: ["PENDING", "PARTIAL"] } },
      include: {
        supplier: { select: { id: true, name: true, rnc: true, phone: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(purchases);
  } catch (error) {
    next(error);
  }
};

export const getAccountsPayableSummary = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { companyId: requireCompanyId(req), status: { in: ["PENDING", "PARTIAL"] } },
      select: { status: true, balance: true }
    });

    const summary = purchases.reduce(
      (acc, purchase) => {
        const balance = Number(purchase.balance);
        acc.totalPayable += balance;
        if (purchase.status === "PENDING") {
          acc.totalPendingPurchases += balance;
          acc.countPending += 1;
        }
        if (purchase.status === "PARTIAL") {
          acc.totalPartialPurchases += balance;
          acc.countPartial += 1;
        }
        return acc;
      },
      { totalPayable: 0, totalPendingPurchases: 0, totalPartialPurchases: 0, countPending: 0, countPartial: 0 }
    );

    res.json({
      totalPayable: summary.totalPayable,
      totalPendingPurchases: summary.totalPendingPurchases,
      totalPartialPurchases: summary.totalPartialPurchases,
      countPending: summary.countPending,
      countPartial: summary.countPartial
    });
  } catch (error) {
    next(error);
  }
};
