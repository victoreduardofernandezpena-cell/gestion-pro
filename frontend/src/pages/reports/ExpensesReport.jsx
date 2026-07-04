import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WalletCards } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { useTheme } from "../../context/ThemeContext";
import { exportReport, getReport } from "../../services/reportService";
import { getChartTheme } from "../../utils/chartTheme";
import { getErrorMessage } from "../../utils/errors";
import { expenseCategoryLabels, expensePaymentSourceLabels, formatDate, money } from "../../utils/format";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

const toChartRows = (object) => Object.entries(object || {}).map(([name, value]) => ({ name, value }));

export default function ExpensesReport() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);
  const tooltipStyle = {
    contentStyle: { background: chartTheme.tooltipBackground, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8 },
    labelStyle: { color: chartTheme.tooltipText },
    itemStyle: { color: chartTheme.tooltipText }
  };
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", category: "", paymentSource: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try { setData(await getReport("expenses", filters)); setError(""); } catch (err) { setError(getErrorMessage(err, "No fue posible cargar gastos")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("expenses", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const columns = [
    { key: "expenseDate", header: "Fecha", render: (row) => formatDate(row.expenseDate) },
    { key: "category", header: "Categoria", render: (row) => expenseCategoryLabels[row.category] },
    { key: "description", header: "Descripcion" },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "paymentSource", header: "Fuente", render: (row) => expensePaymentSourceLabels[row.paymentSource] },
    { key: "reference", header: "Referencia" }
  ];
  if (loading) return <LoadingBox>Cargando reporte de gastos...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Gastos"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(); }}>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
        <FormField label="Categoria" as="select" value={filters.category} onChange={(value) => setFilters({ ...filters, category: value })}><option value="">Todas</option>{Object.entries(expenseCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
        <FormField label="Fuente" as="select" value={filters.paymentSource} onChange={(value) => setFilters({ ...filters, paymentSource: value })}><option value="">Todas</option>{Object.entries(expensePaymentSourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
      </FilterShell>
      <SummaryCard title="Total gastos" value={money.format(Number(data.totalExpenses || 0))} icon={WalletCards} tone="red" />
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-4 font-semibold text-slate-950 dark:text-slate-100">Gastos por categoria</h2><ResponsiveContainer width="100%" height={260}><BarChart data={toChartRows(data.expensesByCategory)}><CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} /><XAxis dataKey="name" tick={{ fill: chartTheme.text }} /><YAxis tick={{ fill: chartTheme.text }} /><Tooltip formatter={(value) => money.format(Number(value))} {...tooltipStyle} /><Bar dataKey="value" fill="#0f9488" /></BarChart></ResponsiveContainer></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"><h2 className="mb-4 font-semibold text-slate-950 dark:text-slate-100">Gastos por mes</h2><ResponsiveContainer width="100%" height={260}><BarChart data={toChartRows(data.expensesByMonth)}><CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} /><XAxis dataKey="name" tick={{ fill: chartTheme.text }} /><YAxis tick={{ fill: chartTheme.text }} /><Tooltip formatter={(value) => money.format(Number(value))} {...tooltipStyle} /><Bar dataKey="value" fill="#0369a1" /></BarChart></ResponsiveContainer></div>
      </section>
      <DataTable columns={columns} rows={data.expenses || []} minWidth="980px" emptyTitle="Sin gastos" />
    </div>
  );
}
