import api from "./api";

export const getBrands = async (search = "") => {
  const { data } = await api.get("/brands", { params: search ? { search } : {} });
  return data;
};

export const createBrand = async (brand) => {
  const { data } = await api.post("/brands", brand);
  return data;
};

export const updateBrand = async (id, brand) => {
  const { data } = await api.put(`/brands/${id}`, brand);
  return data;
};

export const updateBrandStatus = async (id, isActive) => {
  const { data } = await api.patch(`/brands/${id}/status`, { isActive });
  return data;
};
