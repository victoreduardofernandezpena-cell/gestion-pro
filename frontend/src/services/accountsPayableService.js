import api from "./api";

export const getAccountsPayable = async (params = {}) => {
  const { data } = await api.get("/accounts-payable", { params });
  return data;
};

export const getAccountsPayableSummary = async () => {
  const { data } = await api.get("/accounts-payable/summary");
  return data;
};
