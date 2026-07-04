import api from "./api";

export const getTaxSummary = async (params = {}) => {
  const { data } = await api.get("/taxes/summary", { params });
  return data;
};

export const getItbis = async (params = {}) => {
  const { data } = await api.get("/taxes/itbis", { params });
  return data;
};

export const getTaxSales = async (params = {}) => {
  const { data } = await api.get("/taxes/sales", { params });
  return data;
};

export const getTaxPurchases = async (params = {}) => {
  const { data } = await api.get("/taxes/purchases", { params });
  return data;
};

export const getTaxExpenses = async (params = {}) => {
  const { data } = await api.get("/taxes/expenses", { params });
  return data;
};

export const getTaxMonthly = async (params = {}) => {
  const { data } = await api.get("/taxes/monthly", { params });
  return data;
};

export const getTaxReport = async (params = {}) => {
  const { data } = await api.get("/taxes/report", { params });
  return data;
};

export const getTaxAlerts = async (params = {}) => {
  const { data } = await api.get("/taxes/alerts", { params });
  return data;
};

export const getTaxesDashboard = async (params = {}) => {
  const [summary, itbis, sales, purchases, expenses, monthly, report, alerts] = await Promise.all([
    getTaxSummary(params),
    getItbis(params),
    getTaxSales(params),
    getTaxPurchases(params),
    getTaxExpenses(params),
    getTaxMonthly(params),
    getTaxReport(params),
    getTaxAlerts(params)
  ]);

  return { summary, itbis, sales, purchases, expenses, monthly, report, alerts };
};
