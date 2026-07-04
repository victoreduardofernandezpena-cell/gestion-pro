export default function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      <div className="mt-3 h-3 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}
