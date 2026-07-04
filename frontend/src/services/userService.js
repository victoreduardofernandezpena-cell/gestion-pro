import api from "./api";

export const roleLabels = {
  admin: "Admin",
  ventas: "Ventas",
  almacen: "Almacen",
  contabilidad: "Contabilidad"
};

export const getUsers = async (params = {}) => {
  const { data } = await api.get("/users", { params });
  return data;
};

export const createUser = async (user) => {
  const { data } = await api.post("/users", user);
  return data;
};

export const updateUser = async (id, user) => {
  const { data } = await api.put(`/users/${id}`, user);
  return data;
};

export const changeUserStatus = async (id, isActive) => {
  const { data } = await api.patch(`/users/${id}/status`, { isActive });
  return data;
};

export const changeUserPassword = async (id, password) => {
  const { data } = await api.patch(`/users/${id}/password`, { password });
  return data;
};

export const resetUserPassword = async (id, newPassword) => {
  const { data } = await api.patch(`/users/${id}/reset-password`, { newPassword });
  return data;
};
