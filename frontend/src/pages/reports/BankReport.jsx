import { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FinancialOriginLink from "../../components/FinancialOriginLink";
import FormField from "../../components/FormField";
import { exportReport, getReport } from "../../services/reportService";
import { bankTransactionLabels, formatDate, money } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";
import { DEFAULT_PAGINATION } from "../../utils/pagination";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function BankReport() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ bankAccountId: "", transactionType: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const report = await getReport("bank", { ...filters, page, limit: pagination.limit });
      setData(report);
      setPagination(report.meta || { ...pagination, page });
      setError("");
    } catch (err) { setError(getErrorMessage(err, "No fue posible cargar banco")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("bank", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const accountColumns = [
    { key: "bankName", header: "Banco" },
    { key: "name", header: "Cuenta" },
    { key: "accountNumber", header: "Numero" },
    { key: "currentBalance", header: "Balance", render: (row) => money.format(Number(row.currentBalance)) }
  ];
  const txColumns = [
    { key: "transactionDate", header: "Fecha", render: (row) => formatDate(row.transactionDate) },
    { key: "bankAccountName", header: "Cuenta" },
    { key: "type", header: "Tipo", render: (row) => bankTransactionLabels[row.type] },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" },
    { key: "origin", header: "Origen", render: (row) => <FinancialOriginLink origin={row.origin} /> }
  ];
  if (loading) return <LoadingBox>Cargando reporte de banco...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Banco"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <FormField label="Cuenta" as="select" value={filters.bankAccountId} onChange={(value) => setFilters({ ...filters, bankAccountId: value })}><option value="">Todas</option>{(data.accounts || []).map((account) => <option key={account.id} value={account.id}>{account.bankName} - {account.name}</option>)}</FormField>
        <FormField label="Tipo" as="select" value={filters.transactionType} onChange={(value) => setFilters({ ...filters, transactionType: value })}><option value="">Todos</option>{Object.entries(bankTransactionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
      </FilterShell>
      <SummaryCard title="Total en bancos" value={money.format(Number(data.totalBankBalance || 0))} icon={Landmark} tone="green" />
      <section className="space-y-3"><h2 className="text-lg font-semibold">Cuentas</h2><DataTable columns={accountColumns} rows={data.accounts || []} minWidth="760px" emptyTitle="Sin cuentas bancarias" /></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Movimientos</h2><DataTable columns={txColumns} rows={data.transactions || []} pagination={pagination} onPageChange={load} minWidth="980px" emptyTitle="Sin movimientos bancarios" /></section>
    </div>
  );
}
