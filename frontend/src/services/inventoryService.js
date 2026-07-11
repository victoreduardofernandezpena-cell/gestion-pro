import api from "./api";

export const getInventory = async (params = {}) => {
  const { data } = await api.get("/inventory", { params });
  return data;
};

export const getInventoryAlerts = async () => {
  const { data } = await api.get("/inventory/alerts");
  return data;
};

export const getInventoryMovements = async (filters = {}) => {
  const { data } = await api.get("/inventory/movements", { params: filters });
  return data;
};

export const createInventoryMovement = async (movement) => {
  const { data } = await api.post("/inventory/movement", movement);
  return data;
};
