import { useEffect, useState } from "react";
import { CreditCard, FileClock } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { getClients } from "../../services/clientService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../../utils/format";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function AccountsReceivableReport() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", clientId: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [report, clientsData] = await Promise.all([getReport("accounts-receivable", filters), getClients()]);
      setData(report);
      setClients(clientsData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar cuentas por cobrar"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("accounts-receivable", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const columns = [
    { key: "invoiceNumber", header: "Factura", className: "font-medium" },
    { key: "clientName", header: "Cliente" },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "total", header: "Total", render: (row) => money.format(Number(row.total)) },
    { key: "paidAmount", header: "Pagado", render: (row) => money.format(Number(row.paidAmount)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance)) },
    { key: "status", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{statusLabels[row.status]}</span> }
  ];
  if (loading) return <LoadingBox>Cargando cuentas por cobrar...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Cuentas por Cobrar"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(); }}>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
        <FormField label="Cliente" as="select" value={filters.clientId} onChange={(value) => setFilters({ ...filters, clientId: value })}><option value="">Todos</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</FormField>
        <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="PENDING">Pendiente</option><option value="PARTIAL">Parcial</option></FormField>
      </FilterShell>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Total por cobrar" value={money.format(Number(data.totalReceivable || 0))} icon={CreditCard} />
        <SummaryCard title="Pendientes" value={data.countPending || 0} icon={FileClock} tone="amber" />
        <SummaryCard title="Parciales" value={data.countPartial || 0} icon={FileClock} tone="blue" />
      </section>
      <DataTable columns={columns} rows={data.invoices || []} minWidth="980px" emptyTitle="Sin cuentas por cobrar" />
    </div>
  );
}
