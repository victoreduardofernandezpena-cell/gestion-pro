import { useEffect, useState } from "react";
import { FileClock, HandCoins } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { getSuppliers } from "../../services/supplierService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../../utils/format";
import { DEFAULT_PAGINATION } from "../../utils/pagination";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function AccountsPayableReport() {
  const [data, setData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", supplierId: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const [report, suppliersData] = await Promise.all([getReport("accounts-payable", { ...filters, page, limit: pagination.limit }), getSuppliers()]);
      setData(report);
      setPagination(report.meta || { ...pagination, page });
      setSuppliers(suppliersData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar cuentas por pagar"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("accounts-payable", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const columns = [
    { key: "purchaseNumber", header: "Compra", className: "font-medium" },
    { key: "supplierName", header: "Proveedor" },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "total", header: "Total", render: (row) => money.format(Number(row.total)) },
    { key: "paidAmount", header: "Pagado", render: (row) => money.format(Number(row.paidAmount)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance)) },
    { key: "status", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{statusLabels[row.status]}</span> }
  ];
  if (loading) return <LoadingBox>Cargando cuentas por pagar...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Cuentas por Pagar"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
        <FormField label="Proveedor" as="select" value={filters.supplierId} onChange={(value) => setFilters({ ...filters, supplierId: value })}><option value="">Todos</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</FormField>
        <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}><option value="">Todos</option><option value="PENDING">Pendiente</option><option value="PARTIAL">Parcial</option></FormField>
      </FilterShell>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Total por pagar" value={money.format(Number(data.totalPayable || 0))} icon={HandCoins} tone="red" />
        <SummaryCard title="Pendientes" value={data.countPending || 0} icon={FileClock} tone="amber" />
        <SummaryCard title="Parciales" value={data.countPartial || 0} icon={FileClock} tone="blue" />
      </section>
      <DataTable columns={columns} rows={data.purchases || []} pagination={pagination} onPageChange={load} minWidth="980px" emptyTitle="Sin cuentas por pagar" />
    </div>
  );
}
