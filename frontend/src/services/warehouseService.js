import api from "./api";

export const getWarehouses = async (search = "") => {
  const { data } = await api.get("/warehouses", { params: search ? { search } : {} });
  return data;
};

export const createWarehouse = async (warehouse) => {
  const { data } = await api.post("/warehouses", warehouse);
  return data;
};

export const updateWarehouse = async (id, warehouse) => {
  const { data } = await api.put(`/warehouses/${id}`, warehouse);
  return data;
};

export const updateWarehouseStatus = async (id, isActive) => {
  const { data } = await api.patch(`/warehouses/${id}/status`, { isActive });
  return data;
};
