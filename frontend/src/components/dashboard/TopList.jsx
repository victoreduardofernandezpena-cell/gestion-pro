import { money } from "../../utils/format";
import Card from "../Card";
import SectionHeader from "../SectionHeader";

export default function TopList({ title, items = [], valueKey = "total", helperKey = "quantity" }) {
  return (
    <Card>
      <SectionHeader title={title} description="Ranking del periodo seleccionado" />
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-warm-100 p-4 text-sm text-warm-600 dark:bg-warm-950/55 dark:text-warm-400">Sin datos para este periodo.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-warm-200/80 bg-warm-100/70 p-3 transition hover:border-olive-500/25 hover:bg-white dark:border-warm-800 dark:bg-warm-950/35 dark:hover:bg-warm-800/60">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-olive-700 ring-1 ring-warm-300 dark:bg-warm-900 dark:text-terracotta-300 dark:ring-warm-700">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-warm-900 dark:text-warm-100">{item.name}</p>
                  {item[helperKey] !== undefined && <p className="text-xs text-warm-600 dark:text-warm-400">{item[helperKey]} registros</p>}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-warm-800 dark:text-warm-200">{money.format(Number(item[valueKey] || 0))}</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
