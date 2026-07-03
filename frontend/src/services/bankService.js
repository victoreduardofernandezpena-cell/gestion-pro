import api from "./api";

export const getBankAccounts = async () => {
  const { data } = await api.get("/bank/accounts");
  return data;
};

export const getBankAccount = async (id) => {
  const { data } = await api.get(`/bank/accounts/${id}`);
  return data;
};

export const createBankAccount = async (account) => {
  const { data } = await api.post("/bank/accounts", account);
  return data;
};

export const updateBankAccount = async (id, account) => {
  const { data } = await api.put(`/bank/accounts/${id}`, account);
  return data;
};

export const deleteBankAccount = async (id) => {
  const { data } = await api.delete(`/bank/accounts/${id}`);
  return data;
};

export const depositBankAccount = async (id, payload) => {
  const { data } = await api.post(`/bank/accounts/${id}/deposit`, payload);
  return data;
};

export const withdrawBankAccount = async (id, payload) => {
  const { data } = await api.post(`/bank/accounts/${id}/withdraw`, payload);
  return data;
};

export const transferBank = async (payload) => {
  const { data } = await api.post("/bank/transfer", payload);
  return data;
};
