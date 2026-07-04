import api from "./api";

export const accountTypeLabels = {
  ASSET: "Activo",
  LIABILITY: "Pasivo",
  EQUITY: "Capital",
  INCOME: "Ingreso",
  EXPENSE: "Gasto"
};

export const entryStatusLabels = {
  DRAFT: "Borrador",
  POSTED: "Publicado",
  CANCELLED: "Cancelado"
};

export const getAccountingAccounts = async (search = "") => {
  const { data } = await api.get("/accounting/accounts", { params: search ? { search } : {} });
  return data;
};

export const getAccountingAccount = async (id) => {
  const { data } = await api.get(`/accounting/accounts/${id}`);
  return data;
};

export const createAccountingAccount = async (account) => {
  const { data } = await api.post("/accounting/accounts", account);
  return data;
};

export const updateAccountingAccount = async (id, account) => {
  const { data } = await api.put(`/accounting/accounts/${id}`, account);
  return data;
};

export const deleteAccountingAccount = async (id) => {
  const { data } = await api.delete(`/accounting/accounts/${id}`);
  return data;
};

export const getAccountingEntries = async (status = "ALL") => {
  const { data } = await api.get("/accounting/entries", { params: status !== "ALL" ? { status } : {} });
  return data;
};

export const getAccountingEntry = async (id) => {
  const { data } = await api.get(`/accounting/entries/${id}`);
  return data;
};

export const createAccountingEntry = async (entry) => {
  const { data } = await api.post("/accounting/entries", entry);
  return data;
};

export const postAccountingEntry = async (id) => {
  const { data } = await api.patch(`/accounting/entries/${id}/post`);
  return data;
};

export const cancelAccountingEntry = async (id) => {
  const { data } = await api.patch(`/accounting/entries/${id}/cancel`);
  return data;
};

export const getTrialBalance = async () => {
  const { data } = await api.get("/accounting/reports/trial-balance");
  return data;
};

export const getIncomeStatement = async () => {
  const { data } = await api.get("/accounting/reports/income-statement");
  return data;
};

export const getAccountSummary = async () => {
  const { data } = await api.get("/accounting/reports/account-summary");
  return data;
};
