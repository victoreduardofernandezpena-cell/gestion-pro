export default function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => <div key={index} className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />)}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, column) => <div key={column} className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
