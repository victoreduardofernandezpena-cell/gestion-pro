import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FinancialOriginLink from "../../components/FinancialOriginLink";
import FormField from "../../components/FormField";
import { exportReport, getReport } from "../../services/reportService";
import { cashTransactionLabels, formatDate, money } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";
import { DEFAULT_PAGINATION } from "../../utils/pagination";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function CashBoxReport() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ cashBoxId: "", transactionType: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const report = await getReport("cash-box", { ...filters, page, limit: pagination.limit });
      setData(report);
      setPagination(report.meta || { ...pagination, page });
      setError("");
    } catch (err) { setError(getErrorMessage(err, "No fue posible cargar caja chica")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("cash-box", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const boxColumns = [
    { key: "name", header: "Caja" },
    { key: "description", header: "Descripcion" },
    { key: "currentBalance", header: "Balance", render: (row) => money.format(Number(row.currentBalance)) }
  ];
  const txColumns = [
    { key: "transactionDate", header: "Fecha", render: (row) => formatDate(row.transactionDate) },
    { key: "cashBoxName", header: "Caja" },
    { key: "type", header: "Tipo", render: (row) => cashTransactionLabels[row.type] },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" },
    { key: "origin", header: "Origen", render: (row) => <FinancialOriginLink origin={row.origin} /> }
  ];
  if (loading) return <LoadingBox>Cargando reporte de caja chica...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Caja Chica"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <FormField label="Caja" as="select" value={filters.cashBoxId} onChange={(value) => setFilters({ ...filters, cashBoxId: value })}><option value="">Todas</option>{(data.cashBoxes || []).map((box) => <option key={box.id} value={box.id}>{box.name}</option>)}</FormField>
        <FormField label="Tipo" as="select" value={filters.transactionType} onChange={(value) => setFilters({ ...filters, transactionType: value })}><option value="">Todos</option>{Object.entries(cashTransactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
      </FilterShell>
      <SummaryCard title="Total en caja chica" value={money.format(Number(data.totalCashBoxBalance || 0))} icon={WalletCards} tone="green" />
      <section className="space-y-3"><h2 className="text-lg font-semibold">Cajas</h2><DataTable columns={boxColumns} rows={data.cashBoxes || []} minWidth="760px" emptyTitle="Sin cajas" /></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Movimientos</h2><DataTable columns={txColumns} rows={data.transactions || []} pagination={pagination} onPageChange={load} minWidth="980px" emptyTitle="Sin movimientos de caja" /></section>
    </div>
  );
}
