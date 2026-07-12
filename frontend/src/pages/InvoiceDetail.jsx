import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import InvoicePaymentBreakdownModal from "../components/invoices/InvoicePaymentBreakdownModal";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { cancelInvoice, createInvoicePayment, createInvoicePaymentBreakdown, getInvoice } from "../services/invoiceService";
import { getBankAccounts } from "../services/bankService";
import { getCashBoxes } from "../services/cashBoxService";
import { downloadInvoicePdf } from "../services/reportService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, paymentMethodLabels } from "../utils/format";

const emptyPayment = {
  amount: "",
  method: "CASH",
  reference: "",
  notes: "",
  paymentDate: new Date().toISOString().slice(0, 10)
};

function DetailMetric({ label, value, children, tone = "slate" }) {
  const toneClass = {
    slate: "from-slate-500/10",
    green: "from-emerald-500/10",
    amber: "from-amber-500/10",
    red: "from-rose-500/10",
    blue: "from-sky-500/10"
  }[tone];

  return (
    <Card className="relative overflow-hidden">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${toneClass} to-transparent`} />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
        {children || <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{value}</p>}
      </div>
    </Card>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      setInvoice(await getInvoice(id));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar la factura"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
    getBankAccounts().then((rows) => setBankAccounts(rows.filter((account) => account.isActive))).catch(() => setBankAccounts([]));
    getCashBoxes().then((rows) => setCashBoxes(rows.filter((box) => box.isActive))).catch(() => setCashBoxes([]));
  }, [id]);

  const submitPayment = async (event) => {
    event.preventDefault();
    setError("");

    const amount = Number(payment.amount);
    if (Number.isNaN(amount) || amount <= 0) return setError("El monto debe ser mayor que cero");
    if (amount > Number(invoice.balance)) return setError("El monto no puede ser mayor al balance pendiente");
    if (!payment.method) return setError("El metodo de pago es obligatorio");
    if (payment.method === "BANK_TRANSFER" && !payment.bankAccountId) return setError("Selecciona la cuenta bancaria que recibira el pago");
    if (payment.method === "CASH" && !payment.cashBoxId) return setError("Selecciona la caja que recibira el pago");

    setSaving(true);
    try {
      const payload = {
        ...payment,
        amount,
        bankAccountId: payment.method === "BANK_TRANSFER" ? payment.bankAccountId || undefined : undefined,
        cashBoxId: payment.method === "CASH" ? payment.cashBoxId || undefined : undefined
      };
      const result = await createInvoicePayment(invoice.id, payload);
      setInvoice(result.invoice);
      setPayment(emptyPayment);
      toast.success("Pago registrado correctamente");
    } catch (err) {
      toast.error(getErrorMessage(err, "No fue posible registrar el pago"));
      setError(getErrorMessage(err, "No fue posible registrar el pago"));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    setSaving(true);
    setError("");
    try {
      setInvoice(await cancelInvoice(invoice.id));
      toast.success("Factura cancelada");
    } catch (err) {
      toast.error(getErrorMessage(err, "No fue posible cancelar la factura"));
      setError(getErrorMessage(err, "No fue posible cancelar la factura"));
    } finally {
      setSaving(false);
    }
  };

  const savePaymentBreakdown = async (payments) => {
    setSaving(true);
    setError("");
    try {
      const result = await createInvoicePaymentBreakdown(invoice.id, payments);
      setInvoice(result.invoice);
      setShowPaymentBreakdown(false);
      toast.success(result.change > 0 ? `Pago registrado. Devuelta: ${money.format(Number(result.change))}` : "Pago registrado correctamente");
      await loadInvoice();
    } catch (err) {
      const message = getErrorMessage(err, "No fue posible registrar el pago multiple");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible descargar el PDF"));
    }
  };

  if (loading) return <Card>Cargando factura...</Card>;
  if (!invoice) return <AlertMessage>{error || "Factura no encontrada"}</AlertMessage>;

  const canPay = Number(invoice.balance) > 0 && !["CANCELLED", "PAID"].includes(invoice.status);
  const canCancel = ["PENDING", "PARTIAL"].includes(invoice.status) && invoice.payments.length === 0;

  const itemColumns = [
    { key: "code", header: "Codigo", render: (item) => item.product?.code },
    { key: "name", header: "Producto", render: (item) => item.product?.name },
    { key: "quantity", header: "Cantidad" },
    { key: "price", header: "Precio", render: (item) => money.format(Number(item.price)) },
    { key: "cost", header: "Costo", render: (item) => money.format(Number(item.cost)) },
    { key: "total", header: "Total", render: (item) => money.format(Number(item.total)) }
  ];

  const paymentColumns = [
    { key: "paymentDate", header: "Fecha", render: (row) => formatDate(row.paymentDate) },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "method", header: "Metodo", render: (row) => paymentMethodLabels[row.method] },
    { key: "financialTarget", header: "Destino", render: (row) => row.financialTarget?.path ? <Link to={row.financialTarget.path} className="font-semibold text-accent hover:underline">{row.financialTarget.label}</Link> : row.financialTargetLabel || "-" },
    { key: "reference", header: "Referencia" },
    { key: "notes", header: "Notas" }
  ];

  const loyaltyColumns = [
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "type", header: "Tipo" },
    { key: "credential", header: "Credencial", render: (row) => row.loyaltyAccount?.credentialCode || "-" },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "description", header: "Descripcion" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Factura"
        title={invoice.invoiceNumber}
        description={`${invoice.client?.name || "Cliente"} | ${formatDate(invoice.createdAt)}`}
      >
          <Link to="/invoices" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Volver</Link>
          <Button variant="outline" onClick={downloadPdf}>Descargar PDF</Button>
          <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
          {canPay && <Button variant="secondary" onClick={() => setShowPaymentBreakdown(true)}>Pago multiple</Button>}
          {canCancel && (
            <Button variant="danger" onClick={() => setConfirmCancel(true)} loading={saving}>Cancelar factura</Button>
          )}
      </PageHeader>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Estado" tone="blue"><div className="mt-3"><StatusBadge status={invoice.status} /></div></DetailMetric>
        <DetailMetric label="Total" value={money.format(Number(invoice.total))} tone="slate" />
        <DetailMetric label="Pagado" value={money.format(Number(invoice.paidAmount))} tone="green" />
        <DetailMetric label="Balance" value={money.format(Number(invoice.balance))} tone={Number(invoice.balance) > 0 ? "amber" : "green"} />
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Productos facturados</h2>
        <DataTable columns={itemColumns} rows={invoice.items} minWidth="800px" emptyTitle="Sin productos" />
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Historial de pagos</h2>
          <DataTable columns={paymentColumns} rows={invoice.payments} minWidth="760px" emptyTitle="Sin pagos" emptyDescription="Los pagos registrados apareceran aqui." />
        </Card>

        <Card className="xl:sticky xl:top-24 xl:self-start">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Totales</h2>
          <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950/45">
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(invoice.subtotal))}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Impuesto</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(invoice.tax))}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Descuento</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(invoice.discount))}</strong></div>
            {Number(invoice.loyaltyDiscount || 0) > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Credito fidelidad</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(invoice.loyaltyDiscount))}</strong></div>}
          </div>

          {canPay ? (
            <form onSubmit={submitPayment}>
              <h3 className="mb-3 font-semibold text-slate-950 dark:text-slate-100">Registrar pago</h3>
              <FormField label="Monto" type="number" min={0} value={payment.amount} onChange={(value) => setPayment({ ...payment, amount: value })} required />
              <FormField label="Metodo" as="select" value={payment.method} onChange={(value) => setPayment({ ...payment, method: value, bankAccountId: "", cashBoxId: "" })} required>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </FormField>
              {payment.method === "BANK_TRANSFER" && (
                <FormField label="Cuenta bancaria" as="select" value={payment.bankAccountId || ""} onChange={(value) => setPayment({ ...payment, bankAccountId: value })}>
                  <option value="">Selecciona una cuenta</option>
                  {bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {money.format(Number(account.currentBalance))}</option>)}
                </FormField>
              )}
              {payment.method === "CASH" && (
                <FormField label="Caja" as="select" value={payment.cashBoxId || ""} onChange={(value) => setPayment({ ...payment, cashBoxId: value })}>
                  <option value="">Selecciona una caja</option>
                  {cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name} - {money.format(Number(box.currentBalance))}</option>)}
                </FormField>
              )}
              <FormField label="Referencia" value={payment.reference} onChange={(value) => setPayment({ ...payment, reference: value })} />
              <FormField label="Fecha" type="date" value={payment.paymentDate} onChange={(value) => setPayment({ ...payment, paymentDate: value })} required />
              <FormField label="Notas" as="textarea" value={payment.notes} onChange={(value) => setPayment({ ...payment, notes: value })} />
              <Button type="submit" loading={saving} className="w-full">Registrar pago</Button>
            </form>
          ) : (
            <AlertMessage type="info">Esta factura no tiene balance pendiente para pago.</AlertMessage>
          )}
        </Card>
      </section>

      {invoice.loyaltyTransactions?.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Fidelizacion relacionada</h2>
          <DataTable columns={loyaltyColumns} rows={invoice.loyaltyTransactions} minWidth="760px" emptyTitle="Sin movimientos" />
        </Card>
      )}
      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar factura"
        message="Esta accion anulara la factura y devolvera el inventario asociado. Confirma solo si los datos son correctos."
        confirmText="Cancelar factura"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={async () => {
          setConfirmCancel(false);
          await cancel();
        }}
        loading={saving}
      />
      <InvoicePaymentBreakdownModal
        invoice={showPaymentBreakdown ? invoice : null}
        bankAccounts={bankAccounts}
        cashBoxes={cashBoxes}
        onClose={() => setShowPaymentBreakdown(false)}
        onSave={savePaymentBreakdown}
      />
    </div>
  );
}
