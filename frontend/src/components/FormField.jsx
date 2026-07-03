export default function FormField({ label, value, onChange, type = "text", required = false, min, as = "input", children }) {
  const controlClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent";

  return (
    <label className="mb-3 block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      {as === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required}>
          {children}
        </select>
      ) : as === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className={`${controlClass} min-h-24`} required={required} />
      ) : (
        <input value={value} type={type} min={min} onChange={(event) => onChange(event.target.value)} className={controlClass} required={required} />
      )}
    </label>
  );
}
