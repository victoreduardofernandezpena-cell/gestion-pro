import clsx from "clsx";

export default function SectionHeader({ title, description, action, className }) {
  return (
    <div className={clsx("mb-4 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
