import AlertMessage from "../../components/AlertMessage";

export function ReportHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">{eyebrow || "Reportes"}</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function ReportActions({ onExcel, onPdf, onPrint, exporting }) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" onClick={onExcel} disabled={exporting} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition-colors duration-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">CSV</button>
      <button type="button" onClick={onPdf} disabled={exporting} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition-colors duration-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">PDF</button>
      <button type="button" onClick={onPrint} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Imprimir</button>
    </div>
  );
}

export function FilterShell({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="no-print rounded-lg border border-slate-200 bg-white p-4 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 md:grid-cols-4">{children}</div>
      <button className="mt-3 rounded-lg bg-accent px-4 py-2 font-semibold text-white">Aplicar filtros</button>
    </form>
  );
}

export function LoadingBox({ children }) {
  return <div className="rounded-lg bg-white p-6 shadow-soft transition-colors duration-200 dark:bg-slate-900 dark:text-slate-100">{children}</div>;
}

export function ReportError({ children }) {
  return <AlertMessage>{children}</AlertMessage>;
}
