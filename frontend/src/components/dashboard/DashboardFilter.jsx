import Button from "../Button";
import Card from "../Card";

const options = [
  ["today", "Hoy"],
  ["week", "Semana"],
  ["month", "Mes"],
  ["quarter", "Trimestre"],
  ["year", "Año"],
  ["custom", "Rango"]
];

export default function DashboardFilter({ period, startDate, endDate, onPeriodChange, onDateChange, onApply }) {
  return (
    <Card padding="sm" className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-warm-100 p-1 dark:bg-warm-950/70">
        {options.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onPeriodChange(value)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              period === value ? "bg-white text-accent shadow-sm ring-1 ring-warm-300 dark:bg-warm-800 dark:text-terracotta-300 dark:ring-warm-700" : "text-warm-700 hover:bg-white/75 dark:text-warm-300 dark:hover:bg-warm-800/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="date" value={startDate} onChange={(event) => onDateChange("startDate", event.target.value)} className="rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition-colors duration-200 focus:border-accent dark:border-warm-700 dark:bg-warm-950 dark:text-warm-100" />
          <input type="date" value={endDate} onChange={(event) => onDateChange("endDate", event.target.value)} className="rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-warm-900 outline-none transition-colors duration-200 focus:border-accent dark:border-warm-700 dark:bg-warm-950 dark:text-warm-100" />
        </div>
      )}
      <Button variant="secondary" onClick={onApply}>Aplicar</Button>
    </Card>
  );
}
