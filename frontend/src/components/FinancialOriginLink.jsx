import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const toneByStatus = {
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  unresolved: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  missing: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
};

export default function FinancialOriginLink({ origin }) {
  const safeOrigin = origin || {
    label: "Sin origen registrado",
    documentLabel: "Movimiento anterior o sin clasificar",
    status: "missing"
  };
  const tone = toneByStatus[safeOrigin.status] || toneByStatus.missing;
  const content = (
    <span className={`inline-flex max-w-[240px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className="truncate">{safeOrigin.label}</span>
      {safeOrigin.documentLabel && <span className="truncate text-current/75">#{safeOrigin.documentLabel}</span>}
      {safeOrigin.path && <ExternalLink size={12} className="shrink-0" />}
    </span>
  );

  if (!safeOrigin.path) return content;
  return <Link to={safeOrigin.path} className="inline-flex hover:opacity-80">{content}</Link>;
}
