export const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
};

export const statusLabels = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Anulada"
};

export const statusClass = {
  PENDING: "bg-amber-50 text-amber-700",
  PARTIAL: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700"
};

export const paymentMethodLabels = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  CARD: "Tarjeta",
  CHECK: "Cheque",
  OTHER: "Otro"
};

export const bankTransactionLabels = {
  DEPOSIT: "Deposito",
  WITHDRAWAL: "Retiro",
  TRANSFER_IN: "Transferencia recibida",
  TRANSFER_OUT: "Transferencia enviada"
};

export const cashTransactionLabels = {
  CASH_IN: "Entrada",
  CASH_OUT: "Salida",
  ADJUSTMENT: "Ajuste"
};

export const expenseCategoryLabels = {
  RENT: "Alquiler",
  SALARY: "Salario",
  SERVICES: "Servicios",
  TRANSPORT: "Transporte",
  SUPPLIES: "Suministros",
  MAINTENANCE: "Mantenimiento",
  TAXES: "Impuestos",
  OTHER: "Otro"
};

export const expensePaymentSourceLabels = {
  BANK: "Banco",
  CASH_BOX: "Caja chica",
  OTHER: "Otro"
};
