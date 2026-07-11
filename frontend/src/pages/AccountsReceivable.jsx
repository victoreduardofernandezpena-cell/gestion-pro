import { useEffect, useMemo, useState } from "react";
import { Eye, FileClock, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import SummaryCard from "../components/SummaryCard";
import { getAccountsReceivable, getAccountsReceivableSummary } from "../services/accountsReceivableService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";
import { DEFAULT_PAGINATION, normalizePaginatedResult } from "../utils/pagination";

export default function AccountsReceivable() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const load = async (page = pagination.page) => {
    setLoading(true);
    Promise.all([getAccountsReceivable({ page, limit: pagination.limit }), getAccountsReceivableSummary()])
      .then(([receivableRows, summaryData]) => {
        const normalized = normalizePaginatedResult(receivableRows, { ...pagination, page });
        setRows(normalized.rows);
        setPagination(normalized.meta);
        setSummary(summaryData);
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar cuentas por cobrar")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
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

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuentas por cobrar...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cartera</p>
        <h1 className="text-3xl font-semibold text-slate-950">Cuentas por Cobrar</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      {summary && (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total por cobrar" value={money.format(Number(summary.totalReceivable))} icon={WalletCards} tone="amber" />
          <SummaryCard title="Pendientes" value={summary.countPending} helper={money.format(Number(summary.totalPendingInvoices))} icon={FileClock} tone="red" />
          <SummaryCard title="Parciales" value={summary.countPartial} helper={money.format(Number(summary.totalPartialInvoices))} icon={FileClock} tone="blue" />
        </section>
      )}

      <DataTable columns={columns} rows={rows} pagination={pagination} onPageChange={load} minWidth="980px" emptyTitle="Sin cuentas por cobrar" emptyDescription="Las facturas pagadas no aparecen en esta vista." />
    </div>
  );
}
