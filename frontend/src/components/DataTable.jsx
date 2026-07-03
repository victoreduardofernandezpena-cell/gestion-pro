import EmptyState from "./EmptyState";

export default function DataTable({ columns, rows, minWidth = "760px", getRowKey = (row) => row.id, emptyTitle, emptyDescription }) {
  return (
    <div className="table-scroll overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-soft">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-4">
          <EmptyState title={emptyTitle || "Sin resultados"} description={emptyDescription} />
        </div>
      )}
    </div>
  );
}
