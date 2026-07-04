import api from "./api";

export const getDashboardSummary = async () => {
  const { data } = await api.get("/dashboard/summary");
  return data;
};

export const getAdvancedDashboard = async (params = {}) => {
  const { data } = await api.get("/dashboard/advanced", { params });
  return data;
};
