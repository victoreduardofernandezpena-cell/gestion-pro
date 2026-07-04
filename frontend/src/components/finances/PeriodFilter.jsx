import Button from "../Button";
import Card from "../Card";

const options = [
  ["today", "Hoy"],
  ["week", "Semana"],
  ["month", "Mes"],
  ["quarter", "Trimestre"],
  ["year", "Año"],
  ["custom", "Personalizado"]
];

export default function PeriodFilter({ period, startDate, endDate, onPeriodChange, onDateChange, onApply, loading }) {
  return (
    <Card padding="sm" className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-950/70">
        {options.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onPeriodChange(value)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              period === value ? "bg-white text-accent shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-teal-300 dark:ring-slate-700" : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="date" value={startDate} onChange={(event) => onDateChange("startDate", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          <input type="date" value={endDate} onChange={(event) => onDateChange("endDate", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
      )}
      <Button variant="secondary" onClick={onApply} loading={loading}>Aplicar</Button>
    </Card>
  );
}
