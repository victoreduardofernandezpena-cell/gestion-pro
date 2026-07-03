import api from "./api";

export const getPurchases = async () => {
  const { data } = await api.get("/purchases");
  return data;
};

export const getPurchase = async (id) => {
  const { data } = await api.get(`/purchases/${id}`);
  return data;
};

export const createPurchase = async (purchase) => {
  const { data } = await api.post("/purchases", purchase);
  return data;
};

export const cancelPurchase = async (id) => {
  const { data } = await api.patch(`/purchases/${id}/cancel`);
  return data;
};

export const getPurchasePayments = async (id) => {
  const { data } = await api.get(`/purchases/${id}/payments`);
  return data;
};

export const createPurchasePayment = async (id, payment) => {
  const { data } = await api.post(`/purchases/${id}/payments`, payment);
  return data;
};
