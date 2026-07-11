export default function FormField({ label, value, onChange, type = "text", required = false, min, as = "input", children, error, helper, disabled, placeholder, className = "" }) {
  const controlClass = `mt-1.5 min-h-11 w-full rounded-xl border bg-warm-50 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-warm-600/60 focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 disabled:bg-warm-200 disabled:text-warm-600 dark:bg-warm-950 dark:text-warm-100 dark:placeholder:text-warm-600 dark:focus:ring-terracotta-300/20 dark:disabled:bg-warm-900 dark:disabled:text-warm-600 ${error ? "border-red-300 dark:border-red-700" : "border-warm-500 dark:border-warm-800"}`;

  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-warm-700 dark:text-warm-200">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      {as === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required} disabled={disabled}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${controlClass} min-h-28 resize-y`} required={required} disabled={disabled} placeholder={placeholder} />
      ) : (
        <input value={value} type={type} min={min} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required} disabled={disabled} placeholder={placeholder} />
      )}
      {helper && !error && <span className="mt-1 block text-xs text-warm-600 dark:text-warm-600">{helper}</span>}
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-300">{error}</span>}
    </label>
  );
}
