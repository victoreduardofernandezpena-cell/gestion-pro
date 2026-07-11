export default function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-warm-400 bg-warm-50 shadow-soft transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900">
      <div className="grid gap-3 border-b border-warm-400 bg-warm-200 p-4 dark:border-warm-800 dark:bg-warm-950/70" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => <div key={index} className="h-3 animate-pulse rounded bg-warm-400 dark:bg-warm-800" />)}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, column) => <div key={column} className="h-4 animate-pulse rounded bg-warm-300 dark:bg-warm-800" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
