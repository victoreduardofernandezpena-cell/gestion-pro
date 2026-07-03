import api from "./api";

export const getAccountsReceivable = async () => {
  const { data } = await api.get("/accounts-receivable");
  return data;
};

export const getAccountsReceivableSummary = async () => {
  const { data } = await api.get("/accounts-receivable/summary");
  return data;
};
