export default function LoadingSpinner({ label = "Cargando..." }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </span>
  );
}
