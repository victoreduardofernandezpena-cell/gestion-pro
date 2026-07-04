import prisma from "../prisma.js";
import {
  buildAlerts,
  buildCashFlow,
  buildDebts,
  buildExpensesByCategory,
  buildLoyaltySummary,
  buildMonthly,
  buildProfitability,
  buildProjections,
  buildSummary,
  fetchFinanceDataset,
  resolveFinanceRange
} from "../utils/financeAnalytics.js";
import { requireCompanyId } from "../utils/companyScope.js";

const loadFinanceData = async (req) => {
  const companyId = requireCompanyId(req);
  const { period, start, end } = resolveFinanceRange(req.query);
  const data = await fetchFinanceDataset(prisma, companyId, start, end);
  return { companyId, period, start, end, data };
};

export const getFinanceSummary = async (req, res, next) => {
  try {
    const { period, start, end, data } = await loadFinanceData(req);
    res.json({
      ...buildSummary(data, period),
      range: { startDate: start, endDate: end },
      expensesByCategory: buildExpensesByCategory(data),
      loyalty: buildLoyaltySummary(data)
    });
  } catch (error) {
    next(error);
  }
};

export const getFinanceCashFlow = async (req, res, next) => {
  try {
    const { start, end, data } = await loadFinanceData(req);
    res.json(buildCashFlow(data, start, end));
  } catch (error) {
    next(error);
  }
};

export const getFinanceProfitability = async (req, res, next) => {
  try {
    const { start, end, data } = await loadFinanceData(req);
    res.json(buildProfitability(data, start, end));
  } catch (error) {
    next(error);
  }
};

export const getFinanceDebts = async (req, res, next) => {
  try {
    const { data } = await loadFinanceData(req);
    res.json(buildDebts(data));
  } catch (error) {
    next(error);
  }
};

export const getFinanceMonthly = async (req, res, next) => {
  try {
    const { start, end, data } = await loadFinanceData(req);
    res.json(buildMonthly(data, start, end));
  } catch (error) {
    next(error);
  }
};

export const getFinanceAlerts = async (req, res, next) => {
  try {
    const { data } = await loadFinanceData(req);
    res.json(await buildAlerts(data));
  } catch (error) {
    next(error);
  }
};

export const getFinanceProjections = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    res.json(await buildProjections(prisma, companyId));
  } catch (error) {
    next(error);
  }
};
