import api from "./api";

export const loginRequest = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const registerRequest = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data;
};

export const profileRequest = async () => {
  const { data } = await api.get("/auth/profile");
  return data;
};

export const changeForcedPasswordRequest = async (newPassword) => {
  const { data } = await api.patch("/auth/change-forced-password", { newPassword });
  return data;
};
