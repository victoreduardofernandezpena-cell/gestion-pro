import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, ChartNoAxesCombined, CircleDollarSign, CreditCard, FileText, HandCoins, TrendingUp, Wallet } from "lucide-react";
import SummaryCard from "../components/SummaryCard";
import AlertMessage from "../components/AlertMessage";
import { getDashboardSummary } from "../services/dashboardService";
import { getErrorMessage } from "../utils/errors";

const periods = ["Diario", "Semanal", "Mensual", "Trimestral", "Anual"];
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState("Semanal");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar el dashboard")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando dashboard...</div>;
  if (error) return <AlertMessage>{error}</AlertMessage>;
  if (!summary) return <AlertMessage type="info">No hay datos disponibles para mostrar.</AlertMessage>;

  const totals = summary.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Resumen ejecutivo</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Dashboard financiero</h1>
          <p className="mt-1 text-slate-500">Venta, costo y ganancia con filtros de periodo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                period === item ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Venta / Costo / Ganancia</h2>
            <p className="text-sm text-slate-500">Vista {period.toLowerCase()}</p>
          </div>
          <div className="hidden gap-4 text-sm sm:flex">
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-sky-500" />Venta</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-emerald-500" />Costo</span>
            <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-amber-500" />Ganancia</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.chart} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="venta" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => money.format(value)} />
              <Area type="monotone" dataKey="venta" stroke="#0ea5e9" fill="url(#venta)" strokeWidth={3} />
              <Area type="monotone" dataKey="costo" stroke="#10b981" fill="transparent" strokeWidth={3} />
              <Area type="monotone" dataKey="ganancia" stroke="#f59e0b" fill="transparent" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Efectivo en banco" value={money.format(totals.bankCash)} icon={Banknote} tone="blue" />
        <SummaryCard title="Efectivo en caja chica" value={money.format(totals.pettyCash)} icon={Wallet} tone="accent" />
        <SummaryCard title="Cuentas por cobrar" value={money.format(totals.receivables)} icon={CreditCard} tone="amber" />
        <SummaryCard title="Cuentas por pagar" value={money.format(totals.payables)} icon={HandCoins} tone="red" />
        <SummaryCard title="Total ventas" value={money.format(totals.sales)} icon={CircleDollarSign} tone="green" />
        <SummaryCard title="Total costos" value={money.format(totals.costs)} icon={ChartNoAxesCombined} tone="blue" />
        <SummaryCard title="Ganancia" value={money.format(totals.profit)} icon={TrendingUp} tone="green" />
        <SummaryCard title="Total gastos" value={money.format(totals.expenses || 0)} icon={FileText} tone="red" />
        <SummaryCard title="Stock bajo" value={totals.lowStockProducts} helper="Productos bajo minimo" icon={ChartNoAxesCombined} tone="red" />
      </section>
    </div>
  );
}
