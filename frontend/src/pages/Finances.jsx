import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, CreditCard, HandCoins, Landmark, LineChart, Receipt, TrendingUp, Wallet, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import PageLoader from "../components/PageLoader";
import CustomChartTooltip from "../components/dashboard/CustomChartTooltip";
import CashFlowChart from "../components/finances/CashFlowChart";
import DebtAgingCard from "../components/finances/DebtAgingCard";
import FinanceChartCard from "../components/finances/FinanceChartCard";
import FinanceMetricCard from "../components/finances/FinanceMetricCard";
import FinancialAlertPanel from "../components/finances/FinancialAlertPanel";
import PeriodFilter from "../components/finances/PeriodFilter";
import ProfitabilityChart from "../components/finances/ProfitabilityChart";
import TopDebtorsTable from "../components/finances/TopDebtorsTable";
import TopSuppliersTable from "../components/finances/TopSuppliersTable";
import { useTheme } from "../context/ThemeContext";
import { getFinanceDashboard } from "../services/financeService";
import { getChartTheme } from "../utils/chartTheme";
import { getErrorMessage } from "../utils/errors";
import { expenseCategoryLabels, money } from "../utils/format";

const today = new Date().toISOString().slice(0, 10);
const donutColors = ["#0f9488", "#f43f5e"];

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;
const formatAxisMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return amount;
};

export default function Finances() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);
  const [filters, setFilters] = useState({ period: "month", startDate: today, endDate: today });
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFinances = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = nextFilters.period === "custom" ? nextFilters : { period: nextFilters.period };
      setFinance(await getFinanceDashboard(params));
    } catch (err) {
      const message = getErrorMessage(err, "No fue posible cargar el modulo de finanzas");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, []);

  const summary = finance?.summary?.summary || {};
  const counts = finance?.summary?.counts || {};
  const debts = finance?.debts || {};
  const profitability = finance?.profitability || {};
  const cashFlow = finance?.cashFlow || {};
  const monthly = finance?.monthly?.months || [];
  const projections = finance?.projections || {};
  const expensesByCategory = useMemo(
    () => (finance?.summary?.expensesByCategory || []).map((item) => ({ ...item, categoryLabel: expenseCategoryLabels[item.category] || item.category })),
    [finance]
  );
  const debtDonut = [
    { name: "Por cobrar", value: Number(debts.receivables?.total || 0) },
    { name: "Por pagar", value: Number(debts.payables?.total || 0) }
  ];
  const hasData = Object.values(summary).some((value) => typeof value === "number" && value !== 0) || monthly.some((row) => Number(row.sales || 0) || Number(row.expenses || 0));

  const metrics = [
    { title: "Ventas", value: money.format(summary.totalSales || 0), helper: `${counts.invoices || 0} facturas en periodo`, icon: Receipt, tone: "accent" },
    { title: "Ganancia neta", value: money.format(summary.netProfit || 0), helper: `Margen: ${formatPercent(summary.netMargin)}`, icon: TrendingUp, tone: summary.netProfit >= 0 ? "green" : "red" },
    { title: "Efectivo disponible", value: money.format(summary.availableCash || 0), helper: "Banco + caja chica", icon: Wallet, tone: "blue" },
    { title: "Posicion neta", value: money.format(summary.netPosition || 0), helper: "Efectivo + cobrar - pagar", icon: LineChart, tone: summary.netPosition >= 0 ? "green" : "red" },
    { title: "Por cobrar", value: money.format(summary.accountsReceivable || 0), helper: `${counts.pendingInvoices || 0} facturas pendientes`, icon: CreditCard, tone: "amber" },
    { title: "Por pagar", value: money.format(summary.accountsPayable || 0), helper: `${counts.pendingPurchases || 0} compras pendientes`, icon: HandCoins, tone: "red" },
    { title: "Gastos", value: money.format(summary.totalExpenses || 0), helper: `${counts.expenses || 0} gastos registrados`, icon: WalletCards, tone: "amber" },
    { title: "Margen neto", value: formatPercent(summary.netMargin), helper: `Bruto: ${formatPercent(summary.grossMargin)}`, icon: TrendingUp, tone: summary.netMargin >= 0 ? "green" : "red" }
  ];

  if (loading && !finance) return <PageLoader message="Cargando centro financiero..." />;
  if (error && !finance) return <AlertMessage>{error}</AlertMessage>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-soft dark:border-slate-800/80 dark:bg-slate-900/80 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-teal-500/12 via-sky-500/8 to-transparent" />
        <PageHeader
          className="relative"
          eyebrow="Centro financiero"
          title="Finanzas"
          description="Salud financiera del negocio con ventas, gastos, liquidez, deudas, rentabilidad y proyecciones simples."
        >
          <PeriodFilter
            period={filters.period}
            startDate={filters.startDate}
            endDate={filters.endDate}
            loading={loading}
            onPeriodChange={(period) => setFilters((current) => ({ ...current, period }))}
            onDateChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
            onApply={() => loadFinances(filters)}
          />
        </PageHeader>
      </div>

      {error && <AlertMessage>{error}</AlertMessage>}
      {!hasData && <EmptyState title="Todavia no hay datos financieros suficientes." description="Cuando existan ventas, compras, gastos o movimientos, este centro mostrara los indicadores del negocio." />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <FinanceMetricCard key={metric.title} {...metric} />)}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Liquidez</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Posicion financiera actual</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Banco", summary.bankBalance, Landmark],
              ["Caja chica", summary.cashBoxBalance, Banknote],
              ["Por cobrar", summary.accountsReceivable, CreditCard],
              ["Por pagar", summary.accountsPayable, HandCoins],
              ["Posicion neta", summary.netPosition, Wallet]
            ].map(([label, value, Icon]) => (
              <div key={label} className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <Icon size={18} className="text-accent" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">{money.format(Number(value || 0))}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Proyecciones</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Proximo mes</h2>
          <div className="mt-5 space-y-3">
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500 dark:text-slate-400">Ventas estimadas</span><strong className="text-slate-950 dark:text-slate-100">{money.format(projections.projectedSalesNextMonth || 0)}</strong></div>
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500 dark:text-slate-400">Gastos estimados</span><strong className="text-slate-950 dark:text-slate-100">{money.format(projections.projectedExpensesNextMonth || 0)}</strong></div>
            <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500 dark:text-slate-400">Ganancia estimada</span><strong className={projections.projectedNetProfitNextMonth >= 0 ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}>{money.format(projections.projectedNetProfitNextMonth || 0)}</strong></div>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{projections.notes || "Proyeccion simple basada en datos historicos."}</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CashFlowChart data={cashFlow.byMonth || []} chartTheme={chartTheme} />
        <ProfitabilityChart data={profitability.byMonth || monthly} chartTheme={chartTheme} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <FinanceChartCard title="Gastos por categoria" subtitle="Distribucion del gasto operativo">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory} margin={{ left: 4, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="categoryLabel" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={48} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="total" name="Gasto" fill={chartTheme.colors.expenses} radius={[8, 8, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FinanceChartCard>

        <FinanceChartCard title="Rentabilidad por producto" subtitle="Productos con mayor ganancia aproximada">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitability.byProduct || []} layout="vertical" margin={{ left: 18, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke={chartTheme.grid} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} />
                <YAxis type="category" dataKey="product" tickLine={false} axisLine={false} width={130} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="profit" name="Ganancia" fill={chartTheme.colors.profit} radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FinanceChartCard>

        <FinanceChartCard title="Top clientes por ventas" subtitle="Clientes con mayor compra en el periodo">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitability.byClient || []} layout="vertical" margin={{ left: 18, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke={chartTheme.grid} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} />
                <YAxis type="category" dataKey="client" tickLine={false} axisLine={false} width={130} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="totalPurchased" name="Compras" fill={chartTheme.colors.sales} radius={[0, 8, 8, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FinanceChartCard>

        <FinanceChartCard title="Cuentas por cobrar vs pagar" subtitle="Balance pendiente de clientes y proveedores">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={debtDonut} dataKey="value" nameKey="name" innerRadius={70} outerRadius={104} paddingAngle={4} labelLine={false} label={{ fill: chartTheme.text, fontSize: 12 }}>
                  {debtDonut.map((entry, index) => <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />)}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </FinanceChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TopDebtorsTable rows={debts.receivables?.topClients || []} />
        <TopSuppliersTable rows={debts.payables?.topSuppliers || []} />
        <DebtAgingCard title="Cuentas por cobrar" data={debts.agingReceivables || {}} />
        <DebtAgingCard title="Cuentas por pagar" data={debts.agingPayables || {}} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <FinancialAlertPanel alerts={finance?.alerts || []} formatValue={(value) => money.format(value)} />
        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Fidelizacion</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Impacto pendiente</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Balance pendiente</span><strong className="text-slate-950 dark:text-slate-100">{money.format(finance?.summary?.loyalty?.pendingBalance || 0)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Total ganado</span><strong className="text-slate-950 dark:text-slate-100">{money.format(finance?.summary?.loyalty?.totalEarned || 0)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Total redimido</span><strong className="text-slate-950 dark:text-slate-100">{money.format(finance?.summary?.loyalty?.totalRedeemed || 0)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Redimido en periodo</span><strong className="text-slate-950 dark:text-slate-100">{money.format(finance?.summary?.loyalty?.redeemedInPeriod || 0)}</strong></div>
          </div>
        </Card>
      </section>
    </div>
  );
}
