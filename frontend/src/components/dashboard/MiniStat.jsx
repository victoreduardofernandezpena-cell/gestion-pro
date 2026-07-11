import Card from "../Card";

export default function MiniStat({ label, value }) {
  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-accent/70" />
      <p className="text-xs font-medium uppercase tracking-wide text-warm-600 dark:text-warm-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-warm-950 dark:text-warm-100">{value}</p>
    </Card>
  );
}
