const currencyFormatter = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });
const numberFormatter = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 2 });

export const toSafeNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

export const toSafeDate = (value) => {
  if (!value) return null;
  const nextDate = new Date(value);
  return Number.isNaN(nextDate.getTime()) ? null : nextDate;
};

export const money = {
  format: (value) => currencyFormatter.format(toSafeNumber(value))
};

export const formatDate = (value) => {
  const date = toSafeDate(value);
  if (!date) return "-";
  return date.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
};

export const formatDateTime = (value) => {
  const date = toSafeDate(value);
  if (!date) return "-";
  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatNumber = (value) => numberFormatter.format(toSafeNumber(value));

export const statusLabels = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Anulada",
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  DRAFT: "Borrador",
  POSTED: "Posteado",
  EARNED: "Ganado",
  REDEEMED: "Usado",
  ADJUSTMENT: "Ajuste"
  ,
  SUSPENDED: "Suspendido",
  TERMINATED: "Terminado",
  PRESENT: "Presente",
  ABSENT: "Ausente",
  LATE: "Tarde",
  HALF_DAY: "Medio dia",
  VACATION: "Vacaciones",
  SICK: "Enfermo",
  PERMISSION: "Permiso",
  APPROVED: "Aprobada"
};

export const statusClass = {
  PENDING: "bg-amber-50 text-amber-700",
  PARTIAL: "bg-sky-50 text-sky-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-indigo-50 text-indigo-700",
  EARNED: "bg-emerald-50 text-emerald-700",
  REDEEMED: "bg-sky-50 text-sky-700",
  ADJUSTMENT: "bg-violet-50 text-violet-700"
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
