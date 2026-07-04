import prisma from "../prisma.js";
import { requireCompanyId } from "../utils/companyScope.js";
import {
  buildItbis,
  buildTaxAlerts,
  buildTaxMonthly,
  buildTaxReport,
  buildTaxSummary,
  fetchTaxDataset,
  resolveTaxRange,
  serializeTaxExpenses,
  serializeTaxPurchases,
  serializeTaxSales
} from "../utils/taxAnalytics.js";

const loadTaxData = async (req) => {
  const companyId = requireCompanyId(req);
  const { period, start, end } = resolveTaxRange(req.query);
  const data = await fetchTaxDataset(prisma, companyId, start, end, req.query);
  return { period, start, end, data };
};

export const getTaxSummary = async (req, res, next) => {
  try {
    const { period, data } = await loadTaxData(req);
    res.json(buildTaxSummary(data, period));
  } catch (error) {
    next(error);
  }
};

export const getItbis = async (req, res, next) => {
  try {
    const { start, end, data } = await loadTaxData(req);
    res.json(buildItbis(data, start, end));
  } catch (error) {
    next(error);
  }
};

export const getTaxSales = async (req, res, next) => {
  try {
    const { data } = await loadTaxData(req);
    res.json({ sales: serializeTaxSales(data.invoices) });
  } catch (error) {
    next(error);
  }
};

export const getTaxPurchases = async (req, res, next) => {
  try {
    const { data } = await loadTaxData(req);
    res.json({ purchases: serializeTaxPurchases(data.purchases) });
  } catch (error) {
    next(error);
  }
};

export const getTaxExpenses = async (req, res, next) => {
  try {
    const { data } = await loadTaxData(req);
    res.json({ expensesTaxSeparated: false, expenses: serializeTaxExpenses(data.expenses) });
  } catch (error) {
    next(error);
  }
};

export const getTaxMonthly = async (req, res, next) => {
  try {
    const { start, end, data } = await loadTaxData(req);
    res.json(buildTaxMonthly(data, start, end));
  } catch (error) {
    next(error);
  }
};

export const getTaxReport = async (req, res, next) => {
  try {
    const { period, start, end, data } = await loadTaxData(req);
    res.json(buildTaxReport(data, period, start, end, req.user?.company));
  } catch (error) {
    next(error);
  }
};

export const getTaxAlerts = async (req, res, next) => {
  try {
    const { period, data } = await loadTaxData(req);
    res.json(buildTaxAlerts(data, period));
  } catch (error) {
    next(error);
  }
};
