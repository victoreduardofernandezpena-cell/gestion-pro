import api from "./api";

export const loginRequest = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const profileRequest = async () => {
  const { data } = await api.get("/auth/profile");
  return data.user;
};
