import api from "./api";

export const getCashBoxes = async () => {
  const { data } = await api.get("/cash-boxes");
  return data;
};

export const getCashBox = async (id) => {
  const { data } = await api.get(`/cash-boxes/${id}`);
  return data;
};

export const createCashBox = async (cashBox) => {
  const { data } = await api.post("/cash-boxes", cashBox);
  return data;
};

export const updateCashBox = async (id, cashBox) => {
  const { data } = await api.put(`/cash-boxes/${id}`, cashBox);
  return data;
};

export const deleteCashBox = async (id) => {
  const { data } = await api.delete(`/cash-boxes/${id}`);
  return data;
};

export const cashIn = async (id, payload) => {
  const { data } = await api.post(`/cash-boxes/${id}/cash-in`, payload);
  return data;
};

export const cashOut = async (id, payload) => {
  const { data } = await api.post(`/cash-boxes/${id}/cash-out`, payload);
  return data;
};

export const adjustCashBox = async (id, payload) => {
  const { data } = await api.post(`/cash-boxes/${id}/adjustment`, payload);
  return data;
};
