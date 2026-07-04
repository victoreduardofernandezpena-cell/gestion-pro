import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import { entryStatusLabels, getAccountingEntries } from "../services/accountingService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money } from "../utils/format";

const statusClass = {
  DRAFT: "bg-amber-50 text-amber-700",
  POSTED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700"
};

export default function AccountingEntries() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getAccountingEntries(status)
      .then((data) => {
        setEntries(data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar asientos contables")))
      .finally(() => setLoading(false));
  }, [status]);

  const columns = [
    { key: "entryNumber", header: "Numero", className: "font-medium" },
    { key: "date", header: "Fecha", render: (entry) => formatDate(entry.date) },
    { key: "description", header: "Descripcion" },
    { key: "totalDebit", header: "Debito", render: (entry) => money.format(Number(entry.totalDebit || 0)) },
    { key: "totalCredit", header: "Credito", render: (entry) => money.format(Number(entry.totalCredit || 0)) },
    {
      key: "status",
      header: "Estado",
      render: (entry) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[entry.status]}`}>
          {entryStatusLabels[entry.status]}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (entry) => (
        <button onClick={() => navigate(`/contabilidad/asientos/${entry.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Ver asiento">
          <Eye size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contabilidad</p>
          <h1 className="text-3xl font-semibold text-slate-950">Asientos Contables</h1>
        </div>
        <Link to="/contabilidad/asientos/nuevo" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          <Plus size={18} />
          Nuevo Asiento
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "DRAFT", "POSTED", "CANCELLED"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${status === value ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600"}`}
          >
            {value === "ALL" ? "Todos" : entryStatusLabels[value]}
          </button>
        ))}
      </div>

      <AlertMessage>{error}</AlertMessage>

      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow-soft">Cargando asientos contables...</div>
      ) : (
        <DataTable columns={columns} rows={entries} minWidth="980px" emptyTitle="No hay asientos contables" emptyDescription="Crea un asiento manual para empezar." />
      )}
    </div>
  );
}
