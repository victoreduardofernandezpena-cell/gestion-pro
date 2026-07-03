import { useEffect, useState } from "react";
import { CreditCard, FileClock, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import SummaryCard from "../components/SummaryCard";
import { getAccountsPayable, getAccountsPayableSummary } from "../services/accountsPayableService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";

export default function AccountsPayable() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAccountsPayable(), getAccountsPayableSummary()])
      .then(([payables, summaryData]) => {
        setRows(payables);
        setSummary(summaryData);
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar cuentas por pagar")))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "purchaseNumber", header: "Compra", className: "font-medium" },
    { key: "supplier", header: "Proveedor", render: (row) => row.supplier?.name },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "total", header: "Total", render: (row) => money.format(Number(row.total || 0)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance || 0)) },
    {
      key: "status",
      header: "Estado",
      render: (row) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>
          {statusLabels[row.status]}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/purchases/${row.id}`)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
        >
          <CreditCard size={16} />
          Pagar
        </button>
      )
    }
  ];

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuentas por pagar...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cartera</p>
        <h1 className="text-3xl font-semibold text-slate-950">Cuentas por Pagar</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {summary && (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total por pagar" value={money.format(Number(summary.totalPayable || 0))} icon={WalletCards} tone="red" />
          <SummaryCard title="Pendientes" value={summary.countPending || 0} icon={FileClock} tone="amber" />
          <SummaryCard title="Parciales" value={summary.countPartial || 0} icon={FileClock} tone="blue" />
        </section>
      )}
      <DataTable columns={columns} rows={rows} minWidth="980px" emptyTitle="Sin cuentas por pagar" emptyDescription="Las compras pagadas no aparecen en esta vista." />
    </div>
  );
}
