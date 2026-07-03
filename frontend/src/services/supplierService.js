import api from "./api";

export const getSuppliers = async () => {
  const { data } = await api.get("/suppliers");
  return data;
};

export const searchSuppliers = async (search = "") => {
  const { data } = await api.get("/suppliers", { params: { search } });
  return data;
};

export const createSupplier = async (supplier) => {
  const { data } = await api.post("/suppliers", supplier);
  return data;
};

export const updateSupplier = async (id, supplier) => {
  const { data } = await api.put(`/suppliers/${id}`, supplier);
  return data;
};

export const deleteSupplier = async (id) => {
  const { data } = await api.delete(`/suppliers/${id}`);
  return data;
};
