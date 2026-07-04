import Card from "../Card";
import { money } from "../../utils/format";

const labels = {
  current: "0-30 dias",
  days30: "31-60 dias",
  days60: "61-90 dias",
  days90: "91-120 dias",
  over90: "Mas de 120 dias"
};

export default function DebtAgingCard({ title, data = {}, tone = "accent" }) {
  const total = Object.values(data).reduce((sum, value) => sum + Number(value || 0), 0);
  const color = tone === "danger" ? "bg-rose-500" : "bg-teal-500";

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Aging</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
      </div>
      <div className="space-y-3">
        {Object.entries(labels).map(([key, label]) => {
          const value = Number(data[key] || 0);
          const width = total > 0 ? Math.max((value / total) * 100, value > 0 ? 4 : 0) : 0;
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{money.format(value)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
