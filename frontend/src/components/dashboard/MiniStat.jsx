import Card from "../Card";

export default function MiniStat({ label, value }) {
  return (
    <Card padding="sm" className="relative overflow-hidden">
      <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-accent/70" />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">{value}</p>
    </Card>
  );
}
