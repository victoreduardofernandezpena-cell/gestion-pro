import { money } from "../../utils/format";

const defaultFormatter = (value) => money.format(Number(value || 0));

export default function CustomChartTooltip({ active, payload, label, valueFormatter = defaultFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-xl border border-slate-200/80 bg-white/95 p-3 text-sm shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/95 dark:shadow-black/30">
      {label && <p className="mb-2 font-semibold text-slate-900 dark:text-slate-100">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={`${item.name}-${item.dataKey}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}
            </span>
            <strong className="font-semibold text-slate-900 dark:text-slate-100">{valueFormatter(item.value, item.name, item)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
