import { useEffect, useState } from "react";
import { BookOpenCheck, TrendingUp, WalletCards } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import { accountTypeLabels } from "../../services/accountingService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { money } from "../../utils/format";
import { LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function AccountingReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getReport("accounting")
      .then((report) => { setData(report); setError(""); })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar reporte contable")))
      .finally(() => setLoading(false));
  }, []);
  const download = async (format) => { setExporting(true); try { await exportReport("accounting", format); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar")); } finally { setExporting(false); } };
  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Cuenta" },
    { key: "type", header: "Tipo", render: (row) => accountTypeLabels[row.type] },
    { key: "totalDebit", header: "Debito", render: (row) => money.format(Number(row.totalDebit || 0)) },
    { key: "totalCredit", header: "Credito", render: (row) => money.format(Number(row.totalCredit || 0)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance || 0)) }
  ];
  if (loading) return <LoadingBox>Cargando reporte de contabilidad...</LoadingBox>;
  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Contabilidad"><ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} /></ReportHeader>
      <ReportError>{error}</ReportError>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Ingresos" value={money.format(Number(data.incomeStatement?.totalIncome || 0))} icon={TrendingUp} tone="green" />
        <SummaryCard title="Gastos" value={money.format(Number(data.incomeStatement?.totalExpenses || 0))} icon={WalletCards} tone="red" />
        <SummaryCard title="Resultado neto" value={money.format(Number(data.incomeStatement?.netResult || 0))} icon={BookOpenCheck} tone="blue" />
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Resumen de cuentas</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div><p className="text-sm text-slate-500">Activos</p><p className="text-xl font-semibold">{money.format(Number(data.accountSummary?.totalAssets || 0))}</p></div>
          <div><p className="text-sm text-slate-500">Pasivos</p><p className="text-xl font-semibold">{money.format(Number(data.accountSummary?.totalLiabilities || 0))}</p></div>
          <div><p className="text-sm text-slate-500">Capital</p><p className="text-xl font-semibold">{money.format(Number(data.accountSummary?.totalEquity || 0))}</p></div>
          <div><p className="text-sm text-slate-500">Ingresos</p><p className="text-xl font-semibold">{money.format(Number(data.accountSummary?.totalIncome || 0))}</p></div>
          <div><p className="text-sm text-slate-500">Gastos</p><p className="text-xl font-semibold">{money.format(Number(data.accountSummary?.totalExpenses || 0))}</p></div>
        </div>
      </section>
      <DataTable columns={columns} rows={data.trialBalance || []} minWidth="980px" emptyTitle="Sin movimientos publicados" />
    </div>
  );
}
