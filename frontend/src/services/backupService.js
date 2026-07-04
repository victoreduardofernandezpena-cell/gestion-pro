import api from "./api";

export const listBackups = async () => {
  const { data } = await api.get("/backups");
  return data.backups || [];
};

export const createBackup = async () => {
  const { data } = await api.post("/backups/create");
  return data.backup;
};

export const downloadBackup = async (filename) => {
  const { data } = await api.get(`/backups/${filename}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteBackup = async (filename) => {
  const { data } = await api.delete(`/backups/${filename}`);
  return data;
};

export const restoreBackup = async (filename) => {
  const { data } = await api.post(`/backups/${filename}/restore`);
  return data;
};
