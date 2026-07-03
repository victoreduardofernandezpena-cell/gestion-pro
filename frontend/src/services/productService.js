import api from "./api";

export const getProducts = async (search = "") => {
  const { data } = await api.get("/products", { params: { search } });
  return data;
};

export const createProduct = async (product) => {
  const { data } = await api.post("/products", product);
  return data;
};

export const updateProduct = async (id, product) => {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};
