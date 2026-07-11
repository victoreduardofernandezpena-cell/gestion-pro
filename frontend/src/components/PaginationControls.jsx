import Button from "./Button";

export default function PaginationControls({ meta, onPageChange, loading = false }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-warm-400 bg-warm-50 p-3 text-sm text-warm-700 shadow-soft dark:border-warm-800 dark:bg-warm-900 dark:text-warm-300 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Pagina {meta.page} de {meta.totalPages} | {meta.total} registros
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={loading || meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Anterior
        </Button>
        <Button type="button" variant="outline" disabled={loading || meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
