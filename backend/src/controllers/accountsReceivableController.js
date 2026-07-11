import prisma from "../prisma.js";
import { requireCompanyId } from "../utils/companyScope.js";
import { findManyMaybePaginated } from "../utils/pagination.js";

export const listAccountsReceivable = async (req, res, next) => {
  try {
    const invoices = await findManyMaybePaginated(prisma.invoice, {
      where: { companyId: requireCompanyId(req), status: { in: ["PENDING", "PARTIAL"] } },
      include: {
        client: { select: { id: true, name: true, rnc: true, phone: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    }, req.query);

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

export const getAccountsReceivableSummary = async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { companyId: requireCompanyId(req), status: { in: ["PENDING", "PARTIAL"] } },
      select: { status: true, balance: true }
    });

    const summary = invoices.reduce(
      (acc, invoice) => {
        const balance = Number(invoice.balance);
        acc.totalReceivable += balance;
        if (invoice.status === "PENDING") {
          acc.totalPendingInvoices += balance;
          acc.countPending += 1;
        }
        if (invoice.status === "PARTIAL") {
          acc.totalPartialInvoices += balance;
          acc.countPartial += 1;
        }
        return acc;
      },
      { totalReceivable: 0, totalPendingInvoices: 0, totalPartialInvoices: 0, countPending: 0, countPartial: 0 }
    );

    res.json(summary);
  } catch (error) {
    next(error);
  }
};
