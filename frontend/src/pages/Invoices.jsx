import { useEffect, useMemo, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import { getInvoices } from "../services/invoiceService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";

const filters = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Parciales", value: "PARTIAL" },
  { label: "Pagadas", value: "PAID" },
  { label: "Anuladas", value: "CANCELLED" }
];

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = async (nextStatus = status) => {
    setLoading(true);
    try {
      setInvoices(await getInvoices(nextStatus));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar facturas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices("");
  }, []);

  const columns = useMemo(
    () => [
      { key: "invoiceNumber", header: "Factura", className: "font-medium" },
      { key: "client", header: "Cliente", render: (invoice) => invoice.client?.name },
      { key: "createdAt", header: "Fecha", render: (invoice) => formatDate(invoice.createdAt) },
      { key: "total", header: "Total", render: (invoice) => money.format(Number(invoice.total)) },
      { key: "paidAmount", header: "Pagado", render: (invoice) => money.format(Number(invoice.paidAmount)) },
      { key: "balance", header: "Balance", render: (invoice) => money.format(Number(invoice.balance)) },
      {
        key: "status",
        header: "Estado",
        render: (invoice) => (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[invoice.status]}`}>
            {statusLabels[invoice.status]}
          </span>
        )
      },
      {
        key: "actions",
        header: "Acciones",
        align: "right",
        render: (invoice) => (
          <button onClick={() => navigate(`/invoices/${invoice.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Ver factura">
            <Eye size={16} />
          </button>
        )
      }
    ],
    [navigate]
  );

  const changeStatus = (value) => {
    setStatus(value);
    loadInvoices(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Facturacion</p>
          <h1 className="text-3xl font-semibold text-slate-950">Facturas</h1>
        </div>
        <Link to="/invoices/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          <Plus size={18} />
          Nueva Factura
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => changeStatus(filter.value)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              status === filter.value ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <AlertMessage>{error}</AlertMessage>

      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow-soft">Cargando facturas...</div>
      ) : (
        <DataTable columns={columns} rows={invoices} minWidth="980px" emptyTitle="No hay facturas" emptyDescription="Crea una factura o cambia el filtro." />
      )}
    </div>
  );
}
