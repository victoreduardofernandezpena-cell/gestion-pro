import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import SummaryCard from "../components/SummaryCard";
import { BookOpenCheck, Landmark, TrendingUp, WalletCards } from "lucide-react";
import {
  accountTypeLabels,
  getAccountSummary,
  getIncomeStatement,
  getTrialBalance
} from "../services/accountingService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

export default function AccountingReports() {
  const [trialBalance, setTrialBalance] = useState([]);
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [accountSummary, setAccountSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTrialBalance(), getIncomeStatement(), getAccountSummary()])
      .then(([trialData, incomeData, summaryData]) => {
        setTrialBalance(trialData);
        setIncomeStatement(incomeData);
        setAccountSummary(summaryData);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar reportes contables")))
      .finally(() => setLoading(false));
  }, []);

  const trialColumns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Cuenta" },
    { key: "type", header: "Tipo", render: (row) => accountTypeLabels[row.type] },
    { key: "totalDebit", header: "Debito", render: (row) => money.format(Number(row.totalDebit || 0)) },
    { key: "totalCredit", header: "Credito", render: (row) => money.format(Number(row.totalCredit || 0)) },
    { key: "balance", header: "Balance", render: (row) => money.format(Number(row.balance || 0)) }
  ];

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando reportes contables...</div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contabilidad</p>
        <h1 className="text-3xl font-semibold text-slate-950">Reportes Contables</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      {incomeStatement && (
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Ingresos" value={money.format(Number(incomeStatement.totalIncome || 0))} icon={TrendingUp} tone="green" />
          <SummaryCard title="Gastos" value={money.format(Number(incomeStatement.totalExpenses || 0))} icon={WalletCards} tone="red" />
          <SummaryCard title="Resultado neto" value={money.format(Number(incomeStatement.netResult || 0))} icon={BookOpenCheck} tone="blue" />
        </section>
      )}

      {accountSummary && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Landmark size={18} />Resumen de cuentas</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div><p className="text-sm text-slate-500">Activos</p><p className="text-xl font-semibold">{money.format(Number(accountSummary.totalAssets || 0))}</p></div>
            <div><p className="text-sm text-slate-500">Pasivos</p><p className="text-xl font-semibold">{money.format(Number(accountSummary.totalLiabilities || 0))}</p></div>
            <div><p className="text-sm text-slate-500">Capital</p><p className="text-xl font-semibold">{money.format(Number(accountSummary.totalEquity || 0))}</p></div>
            <div><p className="text-sm text-slate-500">Ingresos</p><p className="text-xl font-semibold">{money.format(Number(accountSummary.totalIncome || 0))}</p></div>
            <div><p className="text-sm text-slate-500">Gastos</p><p className="text-xl font-semibold">{money.format(Number(accountSummary.totalExpenses || 0))}</p></div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Balance de comprobacion</h2>
        <DataTable columns={trialColumns} rows={trialBalance} minWidth="980px" emptyTitle="Sin movimientos publicados" emptyDescription="Publica asientos contables para ver el balance de comprobacion." />
      </section>
    </div>
  );
}
