import { money } from "../../utils/format";
import Card from "../Card";
import SectionHeader from "../SectionHeader";

export default function TopList({ title, items = [], valueKey = "total", helperKey = "quantity" }) {
  return (
    <Card>
      <SectionHeader title={title} description="Ranking del periodo seleccionado" />
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">Sin datos para este periodo.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-white dark:border-slate-800 dark:bg-slate-950/30 dark:hover:bg-slate-800/60">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                  {item[helperKey] !== undefined && <p className="text-xs text-slate-500 dark:text-slate-400">{item[helperKey]} registros</p>}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">{money.format(Number(item[valueKey] || 0))}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
