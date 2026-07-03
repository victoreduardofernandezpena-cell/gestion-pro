import api from "./api";

export const getClients = async (search = "") => {
  const { data } = await api.get("/clients", { params: { search } });
  return data;
};

export const createClient = async (client) => {
  const { data } = await api.post("/clients", client);
  return data;
};

export const updateClient = async (id, client) => {
  const { data } = await api.put(`/clients/${id}`, client);
  return data;
};

export const deleteClient = async (id) => {
  await api.delete(`/clients/${id}`);
};
