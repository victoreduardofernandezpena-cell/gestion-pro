import EmptyState from "./EmptyState";

import TableSkeleton from "./TableSkeleton";
import PaginationControls from "./PaginationControls";

export default function DataTable({ columns, rows, minWidth = "760px", getRowKey = (row) => row.id, emptyTitle, emptyDescription, loading = false, pagination, onPageChange }) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  const renderCell = (column, row) => {
    try {
      const value = column.render ? column.render(row) : row?.[column.key];
      if (value === null || value === undefined || value === "") return "-";
      if (typeof value === "number" && !Number.isFinite(value)) return "-";
      return value;
    } catch {
      return "-";
    }
  };

  const resolveRowKey = (row, index) => {
    try {
      return getRowKey(row) ?? index;
    } catch {
      return index;
    }
  };

  if (loading) return <TableSkeleton columns={safeColumns.length || 4} />;

  return (
    <div className="space-y-3">
      <div className="table-scroll overflow-x-auto rounded-2xl border border-warm-400/80 bg-warm-50/95 shadow-soft shadow-stone-900/5 transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900/95 dark:shadow-black/20">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="bg-warm-200/90 text-xs uppercase tracking-[0.14em] text-warm-700 dark:bg-warm-950/70 dark:text-warm-600">
            <tr>
              {safeColumns.map((column) => (
                <th key={column.key} className={`border-b border-warm-400/80 px-4 py-3.5 font-bold dark:border-warm-800 ${column.align === "right" ? "text-right" : ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-400/60 dark:divide-warm-800/80">
            {safeRows.map((row, index) => (
              <tr key={resolveRowKey(row, index)} className="transition-colors duration-150 hover:bg-olive-500/5 dark:hover:bg-warm-800/70">
                {safeColumns.map((column) => (
                  <td key={column.key} className={`px-4 py-3.5 align-middle text-warm-700 dark:text-warm-200 ${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}>
                    {renderCell(column, row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {safeRows.length === 0 && (
          <div className="p-5">
            <EmptyState title={emptyTitle || "Sin resultados"} description={emptyDescription} />
          </div>
        )}
      </div>
      <PaginationControls meta={pagination} onPageChange={onPageChange} loading={loading} />
    </div>
  );
}
