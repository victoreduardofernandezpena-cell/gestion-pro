import api from "./api";

export const getProfile = async () => {
  const { data } = await api.get("/profile");
  return data;
};

export const updateProfile = async (profile) => {
  const { data } = await api.put("/profile", profile);
  return data;
};

export const changeProfilePassword = async (payload) => {
  const { data } = await api.patch("/profile/password", payload);
  return data;
};
