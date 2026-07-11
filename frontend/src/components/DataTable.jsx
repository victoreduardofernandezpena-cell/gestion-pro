import EmptyState from "./EmptyState";

import TableSkeleton from "./TableSkeleton";
import PaginationControls from "./PaginationControls";

export default function DataTable({ columns, rows, minWidth = "760px", getRowKey = (row) => row.id, emptyTitle, emptyDescription, loading = false, pagination, onPageChange }) {
  if (loading) return <TableSkeleton columns={columns.length || 4} />;

  return (
    <div className="space-y-3">
      <div className="table-scroll overflow-x-auto rounded-2xl border border-warm-400/80 bg-warm-50/95 shadow-soft shadow-stone-900/5 transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900/95 dark:shadow-black/20">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="bg-warm-200/90 text-xs uppercase tracking-[0.14em] text-warm-700 dark:bg-warm-950/70 dark:text-warm-600">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`border-b border-warm-400/80 px-4 py-3.5 font-bold dark:border-warm-800 ${column.align === "right" ? "text-right" : ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-400/60 dark:divide-warm-800/80">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="transition-colors duration-150 hover:bg-olive-500/5 dark:hover:bg-warm-800/70">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3.5 align-middle text-warm-700 dark:text-warm-200 ${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-5">
            <EmptyState title={emptyTitle || "Sin resultados"} description={emptyDescription} />
          </div>
        )}
      </div>
      <PaginationControls meta={pagination} onPageChange={onPageChange} loading={loading} />
    </div>
  );
}
