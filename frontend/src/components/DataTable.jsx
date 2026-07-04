import EmptyState from "./EmptyState";

import TableSkeleton from "./TableSkeleton";

export default function DataTable({ columns, rows, minWidth = "760px", getRowKey = (row) => row.id, emptyTitle, emptyDescription, loading = false }) {
  if (loading) return <TableSkeleton columns={columns.length || 4} />;

  return (
    <div className="table-scroll overflow-x-auto rounded-xl border border-slate-200/80 bg-white/95 shadow-soft shadow-slate-900/5 transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/10">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-slate-50/90 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`border-b border-slate-200/70 px-4 py-3.5 font-bold dark:border-slate-800 ${column.align === "right" ? "text-right" : ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="transition-colors duration-150 hover:bg-teal-50/35 dark:hover:bg-slate-800/65">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300 ${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}>
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
  );
}
