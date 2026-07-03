import api from "./api";

export const getInventory = async () => {
  const { data } = await api.get("/inventory");
  return data;
};

export const getInventoryMovements = async () => {
  const { data } = await api.get("/inventory/movements");
  return data;
};

export const createInventoryMovement = async (movement) => {
  const { data } = await api.post("/inventory/movement", movement);
  return data;
};
