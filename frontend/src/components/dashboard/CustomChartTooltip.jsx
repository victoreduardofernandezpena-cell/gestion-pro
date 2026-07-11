import { money } from "../../utils/format";

const defaultFormatter = (value) => money.format(Number(value || 0));

export default function CustomChartTooltip({ active, payload, label, valueFormatter = defaultFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-44 rounded-xl border border-warm-300/80 bg-white/95 p-3 text-sm shadow-xl shadow-warm-900/10 backdrop-blur dark:border-warm-700/80 dark:bg-warm-950/95 dark:shadow-black/30">
      {label && <p className="mb-2 font-semibold text-warm-900 dark:text-warm-100">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={`${item.name}-${item.dataKey}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-warm-600 dark:text-warm-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              {item.name}
            </span>
            <strong className="font-semibold text-warm-900 dark:text-warm-100">{valueFormatter(item.value, item.name, item)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
