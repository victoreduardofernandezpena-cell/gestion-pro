export default function SummaryCard({ title, value, helper, icon: Icon, tone = "accent" }) {
  const tones = {
    accent: "bg-teal-50 text-accent",
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  );
}
