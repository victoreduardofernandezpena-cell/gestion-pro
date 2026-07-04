import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Calculator, CreditCard, Eye, FileText, Printer, Receipt, Scale, ShoppingCart, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import PageLoader from "../components/PageLoader";
import StatusBadge from "../components/StatusBadge";
import ItbisChart from "../components/taxes/ItbisChart";
import TaxAlertPanel from "../components/taxes/TaxAlertPanel";
import TaxMetricCard from "../components/taxes/TaxMetricCard";
import TaxPeriodFilter from "../components/taxes/TaxPeriodFilter";
import TaxTable from "../components/taxes/TaxTable";
import { useTheme } from "../context/ThemeContext";
import { getTaxesDashboard } from "../services/taxesService";
import { getChartTheme } from "../utils/chartTheme";
import { getErrorMessage } from "../utils/errors";
import { expenseCategoryLabels, expensePaymentSourceLabels, formatDate, money } from "../utils/format";

const today = new Date().toISOString().slice(0, 10);

const netStatus = {
  TO_PAY: { label: "Estimado a pagar", className: "text-rose-600 dark:text-rose-300" },
  CREDIT: { label: "Saldo a favor", className: "text-emerald-600 dark:text-emerald-300" },
  ZERO: { label: "Sin diferencia", className: "text-slate-600 dark:text-slate-300" }
};

export default function Taxes() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);
  const [filters, setFilters] = useState({ period: "month", startDate: today, endDate: today });
  const [taxes, setTaxes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTaxes = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = nextFilters.period === "custom" ? nextFilters : { period: nextFilters.period };
      setTaxes(await getTaxesDashboard(params));
    } catch (err) {
      const message = getErrorMessage(err, "No fue posible cargar el modulo de impuestos");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const summary = taxes?.summary?.summary || {};
  const monthly = taxes?.monthly?.months || [];
  const sales = taxes?.sales?.sales || [];
  const purchases = taxes?.purchases?.purchases || [];
  const expenses = taxes?.expenses?.expenses || [];
  const company = taxes?.report?.company || {};
  const status = netStatus[taxes?.itbis?.net?.status] || netStatus.ZERO;
  const hasData = Boolean(summary.invoiceCount || summary.purchaseCount || summary.expenseCount);

  const metrics = [
    { title: "ITBIS cobrado", value: money.format(summary.salesTaxCollected || 0), helper: `${summary.invoiceCount || 0} facturas`, icon: Receipt, tone: "accent" },
    { title: "ITBIS pagado", value: money.format(summary.purchaseTaxPaid || 0), helper: `${summary.purchaseCount || 0} compras`, icon: ShoppingCart, tone: "blue" },
    { title: "Estimado a pagar", value: money.format(summary.estimatedTaxPayable || 0), helper: "ITBIS cobrado - pagado", icon: Calculator, tone: "red" },
    { title: "Saldo a favor", value: money.format(summary.estimatedTaxCredit || 0), helper: "Credito fiscal estimado", icon: Scale, tone: "green" },
    { title: "Ventas gravadas", value: money.format(summary.taxableSales || 0), helper: "Subtotal facturado", icon: BadgeDollarSign, tone: "accent" },
    { title: "Compras gravadas", value: money.format(summary.taxablePurchases || 0), helper: "Subtotal comprado", icon: FileText, tone: "blue" },
    { title: "Gastos del periodo", value: money.format(summary.expensesTotal || 0), helper: `${summary.expenseCount || 0} gastos`, icon: WalletCards, tone: "amber" }
  ];

  const salesColumns = useMemo(() => [
    { key: "invoiceNumber", header: "Numero" },
    { key: "client", header: "Cliente" },
    { key: "date", header: "Fecha", render: (row) => formatDate(row.date) },
    { key: "subtotal", header: "Subtotal", align: "right", render: (row) => money.format(row.subtotal) },
    { key: "tax", header: "ITBIS", align: "right", render: (row) => money.format(row.tax) },
    { key: "total", header: "Total", align: "right", render: (row) => money.format(row.total) },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/invoices/${row.id}`)}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {["PENDING", "PARTIAL"].includes(row.status) ? <CreditCard size={15} /> : <Eye size={15} />}
          {["PENDING", "PARTIAL"].includes(row.status) ? "Pagar" : "Ver"}
        </button>
      )
    }
  ], [navigate]);

  const purchaseColumns = useMemo(() => [
    { key: "purchaseNumber", header: "Numero" },
    { key: "supplier", header: "Proveedor" },
    { key: "date", header: "Fecha", render: (row) => formatDate(row.date) },
    { key: "subtotal", header: "Subtotal", align: "right", render: (row) => money.format(row.subtotal) },
    { key: "tax", header: "ITBIS", align: "right", render: (row) => money.format(row.tax) },
    { key: "total", header: "Total", align: "right", render: (row) => money.format(row.total) },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/purchases/${row.id}`)}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {["PENDING", "PARTIAL"].includes(row.status) ? <CreditCard size={15} /> : <Eye size={15} />}
          {["PENDING", "PARTIAL"].includes(row.status) ? "Pagar" : "Ver"}
        </button>
      )
    }
  ], [navigate]);

  const expenseColumns = useMemo(() => [
    { key: "expenseDate", header: "Fecha", render: (row) => formatDate(row.expenseDate) },
    { key: "category", header: "Categoria", render: (row) => expenseCategoryLabels[row.category] || row.category },
    { key: "description", header: "Descripcion" },
    { key: "paymentSource", header: "Fuente", render: (row) => expensePaymentSourceLabels[row.paymentSource] || row.paymentSource },
    { key: "reference", header: "Referencia", render: (row) => row.reference || "-" },
    { key: "amount", header: "Monto", align: "right", render: (row) => money.format(row.amount) }
  ], []);

  if (loading && !taxes) return <PageLoader message="Cargando resumen fiscal..." />;
  if (error && !taxes) return <AlertMessage>{error}</AlertMessage>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-soft print:border-0 print:shadow-none dark:border-slate-800/80 dark:bg-slate-900/80 sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-teal-500/12 via-sky-500/8 to-transparent print:hidden" />
        <PageHeader
          className="relative"
          eyebrow="Panel fiscal"
          title="Impuestos"
          description="Resumen fiscal e ITBIS del negocio con ventas, compras, gastos y alertas por periodo."
        >
          <div className="flex flex-col gap-3 xl:flex-row">
            <TaxPeriodFilter
              period={filters.period}
              startDate={filters.startDate}
              endDate={filters.endDate}
              loading={loading}
              onPeriodChange={(period) => setFilters((current) => ({ ...current, period }))}
              onDateChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
              onApply={() => loadTaxes(filters)}
            />
            <Button variant="outline" icon={Printer} onClick={() => window.print()} className="print:hidden">Imprimir</Button>
          </div>
        </PageHeader>
      </div>

      {error && <AlertMessage>{error}</AlertMessage>}
      {!hasData && <EmptyState title="No hay datos fiscales para este periodo." description="Cuando existan facturas, compras o gastos, este panel mostrara el resumen fiscal." />}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <TaxMetricCard key={metric.title} {...metric} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <ItbisChart data={monthly} chartTheme={chartTheme} />
        <Card className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Resultado ITBIS</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Neto estimado</h2>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
            <p className={`text-3xl font-semibold tracking-tight ${status.className}`}>{money.format(Math.abs(Number(summary.netTax || 0)))}</p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">{status.label}</p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Calculo: ITBIS cobrado menos ITBIS pagado en compras. Los gastos no tienen ITBIS separado en el modelo actual.</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Empresa</span><strong className="text-right text-slate-950 dark:text-slate-100">{company.businessName || "Empresa"}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">RNC</span><strong className="text-slate-950 dark:text-slate-100">{company.rnc || "-"}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Tasa default</span><strong className="text-slate-950 dark:text-slate-100">{Number(company.defaultTaxRate || 0).toFixed(2)}%</strong></div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Resumen mensual</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">Base fiscal por mes</h2>
          </div>
          <TaxTable
            rows={monthly}
            minWidth="860px"
            getRowKey={(row) => row.month}
            emptyTitle="Sin meses fiscales"
            columns={[
              { key: "month", header: "Mes" },
              { key: "taxableSales", header: "Ventas gravadas", align: "right", render: (row) => money.format(row.taxableSales) },
              { key: "salesTaxCollected", header: "ITBIS cobrado", align: "right", render: (row) => money.format(row.salesTaxCollected) },
              { key: "taxablePurchases", header: "Compras gravadas", align: "right", render: (row) => money.format(row.taxablePurchases) },
              { key: "purchaseTaxPaid", header: "ITBIS pagado", align: "right", render: (row) => money.format(row.purchaseTaxPaid) },
              { key: "expenses", header: "Gastos", align: "right", render: (row) => money.format(row.expenses) },
              { key: "netTax", header: "Neto", align: "right", render: (row) => money.format(row.netTax) }
            ]}
          />
        </Card>
        <TaxAlertPanel alerts={taxes?.alerts || []} formatMoney={(value) => money.format(value)} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Ventas</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">Facturas del periodo</h2>
        </div>
        <TaxTable columns={salesColumns} rows={sales} minWidth="940px" emptyTitle="Sin facturas fiscales" emptyDescription="No hay facturas no canceladas en este periodo." />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Compras</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">Compras del periodo</h2>
        </div>
        <TaxTable columns={purchaseColumns} rows={purchases} minWidth="940px" emptyTitle="Sin compras fiscales" emptyDescription="No hay compras no canceladas en este periodo." />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Gastos</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">Gastos del periodo</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">El modelo actual no separa ITBIS en gastos, por eso se muestran como gastos sin ITBIS separado.</p>
        </div>
        <TaxTable columns={expenseColumns} rows={expenses} minWidth="900px" emptyTitle="Sin gastos" emptyDescription="No hay gastos registrados en este periodo." />
      </section>
    </div>
  );
}
