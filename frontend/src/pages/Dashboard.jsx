import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BadgeDollarSign,
  Banknote,
  Boxes,
  CreditCard,
  FileText,
  HandCoins,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import PageLoader from "../components/PageLoader";
import PageHeader from "../components/PageHeader";
import DashboardFilter from "../components/dashboard/DashboardFilter";
import ChartCard from "../components/dashboard/ChartCard";
import CustomChartTooltip from "../components/dashboard/CustomChartTooltip";
import MetricCard from "../components/dashboard/MetricCard";
import RecentActivityList from "../components/dashboard/RecentActivityList";
import AlertPanel from "../components/dashboard/AlertPanel";
import TopList from "../components/dashboard/TopList";
import MiniStat from "../components/dashboard/MiniStat";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAdvancedDashboard } from "../services/dashboardService";
import { getChartTheme } from "../utils/chartTheme";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const colors = ["#0f766e", "#0284c7", "#f59e0b", "#dc2626", "#7c3aed", "#16a34a"];

const today = new Date().toISOString().slice(0, 10);

const canSeeFinance = (role) => ["admin", "contabilidad"].includes(role);
const canSeeSales = (role) => ["admin", "ventas", "contabilidad"].includes(role);
const canSeeInventory = (role) => ["admin", "almacen"].includes(role);
const canSeePurchases = (role) => ["admin", "contabilidad"].includes(role);
const formatAxisMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (Math.abs(amount) >= 1000) return `${Math.round(amount / 1000)}k`;
  return amount;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);
  const [filters, setFilters] = useState({ period: "month", startDate: today, endDate: today });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = nextFilters.period === "custom" ? nextFilters : { period: nextFilters.period };
      setDashboard(await getAdvancedDashboard(params));
    } catch (err) {
      const message = getErrorMessage(err, "No fue posible cargar el dashboard avanzado");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const role = user?.role;
  const summary = dashboard?.summary || {};
  const charts = dashboard?.charts || {};
  const recent = dashboard?.recentActivity || {};

  const alerts = useMemo(() => {
    if (!dashboard?.alerts) return [];
    const source = dashboard.alerts;
    return [
      source.lowStock?.length ? { title: "Stock bajo", description: `${source.lowStock.length} productos estan por debajo del minimo.` } : null,
      source.pendingInvoices?.length && canSeeSales(role) ? { title: "Facturas pendientes", description: `${source.pendingInvoices.length} facturas tienen balance pendiente.` } : null,
      source.pendingPurchases?.length && canSeePurchases(role) ? { title: "Compras pendientes", description: `${source.pendingPurchases.length} compras tienen balance pendiente.` } : null,
      source.highReceivables?.length && canSeeFinance(role) ? { title: "Cuentas por cobrar altas", description: `${source.highReceivables.length} balances superan el umbral.` } : null,
      source.highExpenses?.length && canSeeFinance(role) ? { title: "Gastos altos", description: `${source.highExpenses.length} gastos relevantes en el periodo.` } : null,
      source.backupWarning && role === "admin" ? { title: "Backups", description: source.backupWarning.message } : null,
      source.loyaltyBalances?.length && ["admin", "ventas"].includes(role) ? { title: "Fidelizacion", description: `${source.loyaltyBalances.length} clientes tienen balance alto pendiente.` } : null
    ];
  }, [dashboard, role]);

  const primaryMetrics = [
    canSeeSales(role) && { title: "Ventas", value: money.format(summary.totalSales || 0), helper: `${summary.pendingInvoices || 0} facturas pendientes`, icon: Receipt, tone: "accent" },
    canSeeFinance(role) && { title: "Ganancia neta", value: money.format(summary.netProfit || 0), helper: `Bruta: ${money.format(summary.grossProfit || 0)}`, icon: TrendingUp, tone: summary.netProfit >= 0 ? "green" : "red" },
    canSeeSales(role) && { title: "Por cobrar", value: money.format(summary.accountsReceivable || 0), helper: "Balance pendiente de clientes", icon: CreditCard, tone: "amber" },
    canSeeFinance(role) && { title: "Por pagar", value: money.format(summary.accountsPayable || 0), helper: `${summary.pendingPurchases || 0} compras pendientes`, icon: HandCoins, tone: "red" }
  ].filter(Boolean);

  const secondaryMetrics = [
    canSeeFinance(role) && { title: "Banco", value: money.format(summary.bankBalance || 0), icon: Banknote, tone: "blue" },
    canSeeFinance(role) && { title: "Caja chica", value: money.format(summary.cashBoxBalance || 0), icon: Wallet, tone: "accent" },
    canSeeFinance(role) && { title: "Gastos", value: money.format(summary.totalExpenses || 0), icon: FileText, tone: "amber" },
    ["admin", "ventas"].includes(role) && { title: "Fidelizacion", value: money.format(summary.loyaltyPendingBalance || 0), icon: BadgeDollarSign, tone: "violet" },
    canSeePurchases(role) && { title: "Compras", value: money.format(summary.totalPurchases || 0), icon: ShoppingCart, tone: "blue" }
  ].filter(Boolean);

  if (loading) return <PageLoader message="Cargando dashboard avanzado..." />;
  if (error) return <AlertMessage>{error}</AlertMessage>;
  if (!dashboard) return <AlertMessage type="info">No hay datos disponibles para mostrar.</AlertMessage>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-soft dark:border-slate-800/80 dark:bg-slate-900/80 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-teal-500/12 via-sky-500/8 to-transparent" />
        <PageHeader
          className="relative"
          eyebrow="Resumen ejecutivo"
          title={`Hola${user?.name ? `, ${user.name}` : ""}`}
          description="Indicadores operativos, graficos y alertas del negocio segun tu rol y el periodo seleccionado."
        >
          <DashboardFilter
            period={filters.period}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onPeriodChange={(period) => setFilters((current) => ({ ...current, period }))}
            onDateChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
            onApply={() => loadDashboard(filters)}
          />
        </PageHeader>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </section>

      {secondaryMetrics.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {secondaryMetrics.slice(0, 4).map((metric) => <MetricCard key={metric.title} {...metric} />)}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Clientes" value={summary.totalClients || 0} />
        <MiniStat label="Productos" value={summary.totalProducts || 0} />
        <MiniStat label="Stock bajo" value={summary.lowStockProducts || 0} />
        {role === "admin" ? <MiniStat label="Usuarios activos" value={summary.activeUsers || 0} /> : <MiniStat label="Clientes fieles" value={summary.activeLoyaltyClients || 0} />}
      </section>

      <ChartCard title="Ventas, compras y ganancia" subtitle="Comportamiento mensual dentro del rango seleccionado" className="min-h-[430px]">
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.salesVsPurchasesByMonth || []} margin={{ left: 4, right: 16, top: 18, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardSalesGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartTheme.colors.sales} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={chartTheme.colors.sales} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} dy={8} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={48} />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: chartTheme.muted, strokeDasharray: "4 4" }} />
              <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text, paddingTop: 16 }} />
              {canSeeSales(role) && <Line type="monotone" dataKey="sales" name="Ventas" stroke={chartTheme.colors.sales} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />}
              {canSeePurchases(role) && <Line type="monotone" dataKey="purchases" name="Compras" stroke={chartTheme.colors.purchases} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />}
              {canSeeFinance(role) && <Line type="monotone" dataKey="profit" name="Ganancia" stroke={chartTheme.colors.profit} strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <section className="grid gap-6 xl:grid-cols-2">
        {canSeeFinance(role) && (
          <ChartCard title="Gastos por categoria" subtitle="Distribucion de gastos del periodo">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expensesByCategory || []} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={44} />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: theme === "dark" ? "rgba(30, 41, 59, 0.45)" : "rgba(241, 245, 249, 0.8)" }} />
                  <Bar dataKey="value" name="Gasto" fill={chartTheme.colors.expenses} radius={[8, 8, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {canSeeSales(role) && (
          <ChartCard title="Top productos vendidos" subtitle="Productos con mayor venta acumulada">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topProducts || []} layout="vertical" margin={{ left: 16, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke={chartTheme.grid} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ fill: theme === "dark" ? "rgba(30, 41, 59, 0.45)" : "rgba(241, 245, 249, 0.8)" }} />
                  <Bar dataKey="total" name="Ventas" fill={chartTheme.colors.purchases} radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {canSeeSales(role) && <TopList title="Top clientes por ventas" items={charts.topClients || []} helperKey="invoices" />}

        {["admin", "ventas"].includes(role) && (
          <ChartCard title="Fidelizacion ganado vs usado" subtitle="Recompensas generadas y redimidas">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.loyaltyEarnedVsRedeemed || []} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4} labelLine={false} label={{ fill: chartTheme.text, fontSize: 12 }}>
                    {(charts.loyaltyEarnedVsRedeemed || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ color: chartTheme.text }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {canSeeFinance(role) && (
          <ChartCard title="Banco y caja chica" subtitle="Liquidez disponible por origen">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.cashFlow || []} margin={{ left: 0, right: 10, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartTheme.colors.sales} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={chartTheme.colors.sales} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={chartTheme.grid} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartTheme.axis, fontSize: 12 }} tickFormatter={formatAxisMoney} width={44} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area type="monotone" dataKey="value" name="Balance" stroke={chartTheme.colors.sales} fill="url(#cashFlowGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_420px]">
        <AlertPanel alerts={alerts} />
        <div className="space-y-6">
          {canSeeSales(role) && <RecentActivityList title="Ultimas facturas" items={recent.invoices || []} getTitle={(item) => item.invoiceNumber} getMeta={(item) => item.client?.name} getAmount={(item) => item.total} />}
          {canSeeFinance(role) && <RecentActivityList title="Ultimos gastos" items={recent.expenses || []} getTitle={(item) => item.description} getMeta={(item) => item.category} getAmount={(item) => item.amount} />}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {canSeePurchases(role) && <RecentActivityList title="Ultimas compras" items={recent.purchases || []} getTitle={(item) => item.purchaseNumber} getMeta={(item) => item.supplier?.name} getAmount={(item) => item.total} />}
        {canSeeInventory(role) && <RecentActivityList title="Movimientos de inventario" items={recent.inventoryMovements || []} getTitle={(item) => `${item.type} - ${item.product?.name || ""}`} getMeta={(item) => item.reason || item.product?.code} />}
        {["admin", "ventas"].includes(role) && <RecentActivityList title="Fidelizacion reciente" items={recent.loyaltyTransactions || []} getTitle={(item) => `${item.type} - ${item.client?.name || ""}`} getMeta={(item) => item.invoice?.invoiceNumber || item.description} getAmount={(item) => item.amount} />}
        {role === "admin" && <RecentActivityList title="Auditoria reciente" items={recent.auditLogs || []} getTitle={(item) => item.action} getMeta={(item) => item.user?.name || item.module} />}
      </section>
    </div>
  );
}
