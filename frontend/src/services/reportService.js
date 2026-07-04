import api from "./api";
import { downloadFile } from "./exportService";

const today = () => new Date().toISOString().slice(0, 10);

export const getReport = async (name, params = {}) => {
  const { data } = await api.get(`/reports/${name}`, { params });
  return data;
};

export const exportReport = async (name, format, params = {}) => {
  const extension = format === "excel" ? "csv" : "pdf";
  await downloadFile(`/reports/${name}/export/${format}`, `reporte_${name.replaceAll("-", "_")}_${today()}.${extension}`, params);
};

export const downloadInvoicePdf = async (id, invoiceNumber = "factura") => {
  await downloadFile(`/invoices/${id}/pdf`, `${invoiceNumber}.pdf`);
};

export const downloadPurchasePdf = async (id, purchaseNumber = "compra") => {
  await downloadFile(`/purchases/${id}/pdf`, `${purchaseNumber}.pdf`);
};
