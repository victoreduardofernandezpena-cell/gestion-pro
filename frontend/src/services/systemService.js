import api from "./api";

export const getSystemHealth = async () => {
  const { data } = await api.get("/system/health");
  return data;
};

export const getSystemStatus = async () => {
  const { data } = await api.get("/system/status");
  return data;
};

export const getSystemInfo = async () => {
  const { data } = await api.get("/system/info");
  return data;
};
