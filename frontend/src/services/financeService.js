import api from "./api";

export const getFinanceSummary = async (params = {}) => {
  const { data } = await api.get("/finances/summary", { params });
  return data;
};

export const getFinanceCashFlow = async (params = {}) => {
  const { data } = await api.get("/finances/cash-flow", { params });
  return data;
};

export const getFinanceProfitability = async (params = {}) => {
  const { data } = await api.get("/finances/profitability", { params });
  return data;
};

export const getFinanceDebts = async (params = {}) => {
  const { data } = await api.get("/finances/debts", { params });
  return data;
};

export const getFinanceMonthly = async (params = {}) => {
  const { data } = await api.get("/finances/monthly", { params });
  return data;
};

export const getFinanceAlerts = async (params = {}) => {
  const { data } = await api.get("/finances/alerts", { params });
  return data;
};

export const getFinanceProjections = async () => {
  const { data } = await api.get("/finances/projections");
  return data;
};

export const getFinanceDashboard = async (params = {}) => {
  const [summary, cashFlow, profitability, debts, monthly, alerts, projections] = await Promise.all([
    getFinanceSummary(params),
    getFinanceCashFlow(params),
    getFinanceProfitability(params),
    getFinanceDebts(params),
    getFinanceMonthly(params),
    getFinanceAlerts(params),
    getFinanceProjections()
  ]);

  return { summary, cashFlow, profitability, debts, monthly, alerts, projections };
};
