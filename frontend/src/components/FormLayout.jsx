import clsx from "clsx";

export function FormPageLayout({ title, subtitle, eyebrow, actions, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function FormCard({ title, description, actions, children, className }) {
  return (
    <section className={clsx("rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-soft shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/10 md:p-6", className)}>
      {(title || description || actions) && (
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function FormSection({ title, description, children, className }) {
  return (
    <div className={clsx("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{title}</h3>}
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function FormGrid({ children, columns = "lg:grid-cols-3", className }) {
  return (
    <div className={clsx("grid gap-4 sm:grid-cols-2", columns, className)}>
      {children}
    </div>
  );
}

export function ActionBar({ children, className }) {
  return (
    <div className={clsx("flex flex-col gap-2 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {children}
    </div>
  );
}

export function ModernCheckbox({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "flex min-h-[72px] items-start gap-3 rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 dark:focus-visible:ring-teal-900/40",
        checked
          ? "border-accent bg-teal-50/80 text-slate-950 shadow-sm dark:bg-teal-950/30 dark:text-slate-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-600"
      )}
    >
      <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", checked ? "border-accent bg-accent text-white" : "border-slate-300 dark:border-slate-600")}>
        {checked && <span className="h-2.5 w-2.5 rounded-sm bg-white" />}
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{description}</span>}
      </span>
    </button>
  );
}
