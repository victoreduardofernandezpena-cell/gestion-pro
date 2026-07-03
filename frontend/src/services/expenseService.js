import api from "./api";

export const getExpenses = async (filters = {}) => {
  const { data } = await api.get("/expenses", { params: filters });
  return data;
};

export const createExpense = async (expense) => {
  const { data } = await api.post("/expenses", expense);
  return data;
};

export const updateExpense = async (id, expense) => {
  const { data } = await api.put(`/expenses/${id}`, expense);
  return data;
};

export const deleteExpense = async (id) => {
  const { data } = await api.delete(`/expenses/${id}`);
  return data;
};

export const getExpenseSummary = async () => {
  const { data } = await api.get("/expenses/summary");
  return data;
};
