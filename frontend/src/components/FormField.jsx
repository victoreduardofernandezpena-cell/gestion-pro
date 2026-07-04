export default function FormField({ label, value, onChange, type = "text", required = false, min, as = "input", children, error, helper, disabled }) {
  const controlClass = `mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-teal-900/40 dark:disabled:bg-slate-900 dark:disabled:text-slate-500 ${error ? "border-rose-300 dark:border-rose-700" : "border-slate-300 dark:border-slate-700"}`;

  return (
    <label className="mb-3 block">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {as === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required} disabled={disabled}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${controlClass} min-h-24`} required={required} disabled={disabled} />
      ) : (
        <input value={value} type={type} min={min} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required} disabled={disabled} />
      )}
      {helper && !error && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{helper}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600 dark:text-rose-300">{error}</span>}
    </label>
  );
}
