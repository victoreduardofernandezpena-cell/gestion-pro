import api from "./api";

export const documentTypeLabels = {
  INVOICE: "Factura",
  PURCHASE: "Compra",
  ACCOUNTING_ENTRY: "Asiento contable"
};

export const categoryTypeLabels = {
  EXPENSE: "Gasto",
  PRODUCT: "Producto",
  CLIENT: "Cliente",
  SUPPLIER: "Proveedor",
  PAYMENT: "Pago",
  OTHER: "Otro"
};

export const getCompanySettings = async () => (await api.get("/settings/company")).data;
export const updateCompanySettings = async (payload) => (await api.put("/settings/company", payload)).data;
export const uploadCompanyLogo = async (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  return (await api.post("/settings/company/logo", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const getTaxes = async () => (await api.get("/settings/taxes")).data;
export const createTax = async (payload) => (await api.post("/settings/taxes", payload)).data;
export const updateTax = async (id, payload) => (await api.put(`/settings/taxes/${id}`, payload)).data;
export const changeTaxStatus = async (id, isActive) => (await api.patch(`/settings/taxes/${id}/status`, { isActive })).data;
export const setDefaultTax = async (id) => (await api.patch(`/settings/taxes/${id}/default`)).data;
export const getNumbering = async () => (await api.get("/settings/numbering")).data;
export const createNumbering = async (payload) => (await api.post("/settings/numbering", payload)).data;
export const updateNumbering = async (id, payload) => (await api.put(`/settings/numbering/${id}`, payload)).data;
export const changeNumberingStatus = async (id, isActive) => (await api.patch(`/settings/numbering/${id}/status`, { isActive })).data;
export const getCategories = async (type = "") => (await api.get("/settings/categories", { params: type ? { type } : {} })).data;
export const createCategory = async (payload) => (await api.post("/settings/categories", payload)).data;
export const updateCategory = async (id, payload) => (await api.put(`/settings/categories/${id}`, payload)).data;
export const changeCategoryStatus = async (id, isActive) => (await api.patch(`/settings/categories/${id}/status`, { isActive })).data;
export const getDocumentSettings = async () => (await api.get("/settings/documents")).data;
export const updateDocumentSettings = async (payload) => (await api.put("/settings/documents", payload)).data;
