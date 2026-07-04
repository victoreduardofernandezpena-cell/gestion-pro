import api from "./api";

export const getLoyaltySummary = async () => {
  const { data } = await api.get("/loyalty");
  return data;
};

export const getLoyaltyAccounts = async (search = "") => {
  const { data } = await api.get("/loyalty/accounts", { params: search ? { search } : {} });
  return data;
};

export const getLoyaltyAccount = async (id) => {
  const { data } = await api.get(`/loyalty/accounts/${id}`);
  return data;
};

export const getClientLoyaltyAccount = async (clientId) => {
  const { data } = await api.get(`/loyalty/client/${clientId}`);
  return data;
};

export const createLoyaltyAccount = async (clientId) => {
  const { data } = await api.post("/loyalty/accounts", { clientId });
  return data;
};

export const updateLoyaltyAccountStatus = async (id, isActive) => {
  const { data } = await api.patch(`/loyalty/accounts/${id}/status`, { isActive });
  return data;
};

export const regenerateLoyaltyCredential = async (id) => {
  const { data } = await api.post(`/loyalty/accounts/${id}/regenerate-credential`);
  return data;
};

export const findLoyaltyCredential = async (credentialCode) => {
  const { data } = await api.get(`/loyalty/credential/${credentialCode}`);
  return data;
};

export const getLoyaltyTransactions = async (filters = {}) => {
  const { data } = await api.get("/loyalty/transactions", { params: filters });
  return data;
};

export const getLoyaltySettings = async () => {
  const { data } = await api.get("/loyalty/settings");
  return data;
};

export const updateLoyaltySettings = async (settings) => {
  const { data } = await api.put("/loyalty/settings", settings);
  return data;
};

export const createLoyaltyAdjustment = async (id, payload) => {
  const { data } = await api.post(`/loyalty/accounts/${id}/adjustment`, payload);
  return data;
};
