export default function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-warm-400 bg-warm-50 p-5 shadow-soft transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900">
      <div className="h-4 w-24 animate-pulse rounded bg-warm-300 dark:bg-warm-800" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-warm-300 dark:bg-warm-800" />
      <div className="mt-3 h-3 w-40 animate-pulse rounded bg-warm-300 dark:bg-warm-800" />
    </div>
  );
}
