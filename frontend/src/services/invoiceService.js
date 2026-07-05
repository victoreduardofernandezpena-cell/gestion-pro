import api from "./api";

export const getInvoices = async (filters = "") => {
  const params = typeof filters === "string" ? (filters ? { status: filters } : {}) : filters;
  const { data } = await api.get("/invoices", { params });
  return data;
};

export const getInvoice = async (id) => {
  const { data } = await api.get(`/invoices/${id}`);
  return data;
};

export const createInvoice = async (invoice) => {
  const { data } = await api.post("/invoices", invoice);
  return data;
};

export const updateInvoice = async (id, invoice) => {
  const { data } = await api.put(`/invoices/${id}`, invoice);
  return data;
};

export const cancelInvoice = async (id) => {
  const { data } = await api.patch(`/invoices/${id}/cancel`);
  return data;
};

export const getInvoicePayments = async (id) => {
  const { data } = await api.get(`/invoices/${id}/payments`);
  return data;
};

export const createInvoicePayment = async (id, payment) => {
  const { data } = await api.post(`/invoices/${id}/payments`, payment);
  return data;
};
