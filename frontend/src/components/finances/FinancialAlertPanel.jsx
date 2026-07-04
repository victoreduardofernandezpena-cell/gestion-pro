import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import Card from "../Card";
import EmptyState from "../EmptyState";

const styles = {
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200",
  danger: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
};

const icons = {
  info: Info,
  warning: TriangleAlert,
  danger: AlertCircle,
  success: CheckCircle2
};

const formatAlertValue = (alert, formatter) => {
  if (alert.type === "low_stock") return `${alert.value} productos`;
  if (alert.type === "healthy") return null;
  return formatter(alert.value);
};

export default function FinancialAlertPanel({ alerts = [], formatValue }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Alertas financieras</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Riesgos y prioridades</h2>
      </div>
      {!alerts.length ? (
        <EmptyState title="Sin alertas financieras" description="No hay eventos relevantes para el periodo seleccionado." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = icons[alert.severity] || Info;
            return (
              <div key={`${alert.type}-${alert.title}`} className={`rounded-xl border p-4 ${styles[alert.severity] || styles.info}`}>
                <div className="flex items-start gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm opacity-80">{alert.message}</p>
                    {typeof alert.value === "number" && alert.value !== 0 && <p className="mt-2 text-sm font-semibold">{formatAlertValue(alert, formatValue)}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
