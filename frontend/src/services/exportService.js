import api from "./api";

export const downloadFile = async (url, filename, params = {}) => {
  const { data } = await api.get(url, { params, responseType: "blob" });
  const href = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};
