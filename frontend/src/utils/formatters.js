export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value || 0));

export const formatNumber = (value) =>
  new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 }).format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "2-digit" });
};

export const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
