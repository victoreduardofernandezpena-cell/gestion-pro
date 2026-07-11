import api from "./api";

export const getAccountsReceivable = async (params = {}) => {
  const { data } = await api.get("/accounts-receivable", { params });
  return data;
};

export const getAccountsReceivableSummary = async () => {
  const { data } = await api.get("/accounts-receivable/summary");
  return data;
};
