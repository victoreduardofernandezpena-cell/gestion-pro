import { useEffect, useState } from "react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { Receipt, TrendingUp, WalletCards } from "lucide-react";
import { getClients } from "../../services/clientService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../../utils/format";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function SalesReport() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", clientId: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [report, clientsData] = await Promise.all([getReport("sales", filters), getClients()]);
      setData(report);
      setClients(clientsData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar reporte de ventas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const download = async (format) => {
    setExporting(true);
    try { await exportReport("sales", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar ventas")); } finally { setExporting(false); }
  };

  const columns = [
    { key: "invoiceNumber", header: "Factura", className: "font-medium" },
    { key: "clientName", header: "Cliente" },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "total", header: "Total", render: (row) => money.format(Number(row.total)) },
    { key: "paidAmount", header: "Pagado", render: (row) => money.format(Number(row.paidAmount)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance)) },
    { key: "status", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{statusLabels[row.status]}</span> }
  ];

  if (loading) return <LoadingBox>Cargando reporte de ventas...</LoadingBox>;

  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Ventas">
        <ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} />
      </ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(); }}>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
        <FormField label="Cliente" as="select" value={filters.clientId} onChange={(value) => setFilters({ ...filters, clientId: value })}>
          <option value="">Todos</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </FormField>
        <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
          <option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FormField>
      </FilterShell>
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total ventas" value={money.format(Number(data.totalSales || 0))} icon={Receipt} />
        <SummaryCard title="Total costo" value={money.format(Number(data.totalCost || 0))} icon={WalletCards} tone="amber" />
        <SummaryCard title="Ganancia bruta" value={money.format(Number(data.grossProfit || 0))} icon={TrendingUp} tone="green" />
        <SummaryCard title="Facturas" value={data.countInvoices || 0} icon={Receipt} tone="blue" />
      </section>
      <DataTable columns={columns} rows={data.invoices || []} minWidth="980px" emptyTitle="Sin ventas" emptyDescription="No hay facturas con los filtros aplicados." />
    </div>
  );
}
