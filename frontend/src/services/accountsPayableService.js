import api from "./api";

export const getAccountsPayable = async () => {
  const { data } = await api.get("/accounts-payable");
  return data;
};

export const getAccountsPayableSummary = async () => {
  const { data } = await api.get("/accounts-payable/summary");
  return data;
};
