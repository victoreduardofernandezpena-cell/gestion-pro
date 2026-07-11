import clsx from "clsx";

const labels = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
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

const tones = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/70",
  PARTIAL: "bg-orange-50 text-terracotta-500 ring-orange-200 dark:bg-orange-950/40 dark:text-terracotta-300 dark:ring-orange-900/70",
  PAID: "bg-emerald-50 text-olive-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70",
  CANCELLED: "bg-warm-200 text-warm-700 ring-warm-500 dark:bg-warm-800 dark:text-warm-300 dark:ring-warm-700",
  ACTIVE: "bg-emerald-50 text-olive-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70",
  INACTIVE: "bg-warm-200 text-warm-700 ring-warm-500 dark:bg-warm-800 dark:text-warm-300 dark:ring-warm-700",
  DRAFT: "bg-warm-200 text-warm-700 ring-warm-500 dark:bg-warm-800 dark:text-warm-300 dark:ring-warm-700",
  POSTED: "bg-olive-500/10 text-olive-700 ring-olive-500/20 dark:bg-olive-500/20 dark:text-olive-500 dark:ring-olive-500/30",
  EARNED: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70",
  REDEEMED: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/70",
  ADJUSTMENT: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/70"
  ,
  SUSPENDED: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/70",
  TERMINATED: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/70",
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/70",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/70",
  LATE: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/70",
  HALF_DAY: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/70",
  VACATION: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/70",
  SICK: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/70",
  PERMISSION: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  APPROVED: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/70"
};

export default function StatusBadge({ status, children }) {
  const normalized = String(status || "").toUpperCase();
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-colors duration-200", tones[normalized] || "bg-warm-200 text-warm-700 ring-warm-500 dark:bg-warm-800 dark:text-warm-300 dark:ring-warm-700")}>
      {children || labels[normalized] || status || "Sin estado"}
    </span>
  );
}
