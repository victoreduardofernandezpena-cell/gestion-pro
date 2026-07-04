import { useEffect, useState } from "react";
import { HandCoins, ShoppingCart, WalletCards } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { getSuppliers } from "../../services/supplierService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../../utils/format";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function PurchasesReport() {
  const [data, setData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", supplierId: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [report, suppliersData] = await Promise.all([getReport("purchases", filters), getSuppliers()]);
      setData(report);
      setSuppliers(suppliersData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar reporte de compras"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const download = async (format) => {
    setExporting(true);
    try { await exportReport("purchases", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar compras")); } finally { setExporting(false); }
  };

  const columns = [
    { key: "purchaseNumber", header: "Compra", className: "font-medium" },
    { key: "supplierName", header: "Proveedor" },
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "total", header: "Total", render: (row) => money.format(Number(row.total)) },
    { key: "paidAmount", header: "Pagado", render: (row) => money.format(Number(row.paidAmount)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance)) },
    { key: "status", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{statusLabels[row.status]}</span> }
  ];

  if (loading) return <LoadingBox>Cargando reporte de compras...</LoadingBox>;

  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Compras">
        <ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} />
      </ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(); }}>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
        <FormField label="Proveedor" as="select" value={filters.supplierId} onChange={(value) => setFilters({ ...filters, supplierId: value })}>
          <option value="">Todos</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </FormField>
        <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
          <option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FormField>
      </FilterShell>
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total compras" value={money.format(Number(data.totalPurchases || 0))} icon={ShoppingCart} />
        <SummaryCard title="Total pagado" value={money.format(Number(data.totalPaid || 0))} icon={WalletCards} tone="green" />
        <SummaryCard title="Balance pendiente" value={money.format(Number(data.totalBalance || 0))} icon={HandCoins} tone="red" />
        <SummaryCard title="Compras" value={data.countPurchases || 0} icon={ShoppingCart} tone="blue" />
      </section>
      <DataTable columns={columns} rows={data.purchases || []} minWidth="980px" emptyTitle="Sin compras" emptyDescription="No hay compras con los filtros aplicados." />
    </div>
  );
}
