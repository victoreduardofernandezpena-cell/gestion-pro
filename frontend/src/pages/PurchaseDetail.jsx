import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import Card from "../components/Card";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { getBankAccounts } from "../services/bankService";
import { getCashBoxes } from "../services/cashBoxService";
import { cancelPurchase, createPurchasePayment, getPurchase } from "../services/purchaseService";
import { downloadPurchasePdf } from "../services/reportService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, paymentMethodLabels } from "../utils/format";

const emptyPayment = {
  amount: "",
  method: "BANK_TRANSFER",
  bankAccountId: "",
  cashBoxId: "",
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

export default function PurchaseDetail() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [payment, setPayment] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPurchase = async () => {
    setLoading(true);
    try {
      const [purchaseData, accountsData, cashBoxesData] = await Promise.all([getPurchase(id), getBankAccounts(), getCashBoxes()]);
      setPurchase(purchaseData);
      setBankAccounts(accountsData.filter((account) => account.isActive));
      setCashBoxes(cashBoxesData.filter((box) => box.isActive));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar la compra"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchase();
  }, [id]);

  const submitPayment = async (event) => {
    event.preventDefault();
    setError("");
    const amount = Number(payment.amount);
    if (Number.isNaN(amount) || amount <= 0) return setError("El monto debe ser mayor que cero");
    if (amount > Number(purchase.balance)) return setError("El monto no puede ser mayor al balance pendiente");
    if (!payment.method) return setError("El metodo de pago es obligatorio");
    if (payment.method === "BANK_TRANSFER" && !payment.bankAccountId) return setError("Selecciona la cuenta bancaria que realizara el pago");
    if (payment.method === "CASH" && !payment.cashBoxId) return setError("Selecciona la caja que realizara el pago");

    const selectedBankAccount = bankAccounts.find((account) => String(account.id) === String(payment.bankAccountId));
    if (payment.method === "BANK_TRANSFER" && selectedBankAccount && amount > Number(selectedBankAccount.currentBalance)) {
      return setError("La cuenta bancaria seleccionada no tiene balance suficiente");
    }
    const selectedCashBox = cashBoxes.find((box) => String(box.id) === String(payment.cashBoxId));
    if (payment.method === "CASH" && selectedCashBox && amount > Number(selectedCashBox.currentBalance)) {
      return setError("La caja seleccionada no tiene balance suficiente");
    }

    setSaving(true);
    try {
      const result = await createPurchasePayment(purchase.id, {
        ...payment,
        amount,
        bankAccountId: payment.method === "BANK_TRANSFER" ? Number(payment.bankAccountId) : null,
        cashBoxId: payment.method === "CASH" ? Number(payment.cashBoxId) : null
      });
      setPurchase(result.purchase);
      setPayment(emptyPayment);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible registrar el pago"));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancelar esta compra? Esta accion descontara del inventario los productos comprados.")) return;
    setSaving(true);
    setError("");
    try {
      setPurchase(await cancelPurchase(purchase.id));
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cancelar la compra"));
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    try {
      await downloadPurchasePdf(purchase.id, purchase.purchaseNumber);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible descargar el PDF"));
    }
  };

  if (loading) return <Card>Cargando compra...</Card>;
  if (!purchase) return <AlertMessage>{error || "Compra no encontrada"}</AlertMessage>;

  const canPay = Number(purchase.balance) > 0 && !["CANCELLED", "PAID"].includes(purchase.status);
  const canCancel = ["PENDING", "PARTIAL"].includes(purchase.status) && purchase.payments.length === 0;

  const itemColumns = [
    { key: "code", header: "Codigo", render: (item) => item.product?.code },
    { key: "name", header: "Producto", render: (item) => item.product?.name },
    { key: "quantity", header: "Cantidad" },
    { key: "cost", header: "Costo", render: (item) => money.format(Number(item.cost)) },
    { key: "total", header: "Total", render: (item) => money.format(Number(item.total)) }
  ];

  const paymentColumns = [
    { key: "paymentDate", header: "Fecha", render: (row) => formatDate(row.paymentDate) },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "method", header: "Metodo", render: (row) => paymentMethodLabels[row.method] },
    { key: "financialTarget", header: "Origen financiero", render: (row) => row.financialTarget?.path ? <Link to={row.financialTarget.path} className="font-semibold text-accent hover:underline">{row.financialTarget.label}</Link> : row.financialTargetLabel || "-" },
    { key: "reference", header: "Referencia" },
    { key: "notes", header: "Notas" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compra"
        title={purchase.purchaseNumber}
        description={`${purchase.supplier?.name || "Proveedor"} | ${formatDate(purchase.createdAt)}`}
      >
          <Link to="/purchases" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Volver</Link>
          <Button variant="outline" onClick={downloadPdf}>Descargar PDF</Button>
          <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
          {canCancel && (
            <Button variant="danger" onClick={cancel} loading={saving}>Cancelar compra</Button>
          )}
      </PageHeader>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Estado" tone="blue"><div className="mt-3"><StatusBadge status={purchase.status} /></div></DetailMetric>
        <DetailMetric label="Total" value={money.format(Number(purchase.total))} tone="slate" />
        <DetailMetric label="Pagado" value={money.format(Number(purchase.paidAmount))} tone="green" />
        <DetailMetric label="Balance" value={money.format(Number(purchase.balance))} tone={Number(purchase.balance) > 0 ? "amber" : "green"} />
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Productos comprados</h2>
        <DataTable columns={itemColumns} rows={purchase.items} minWidth="760px" emptyTitle="Sin productos" />
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Historial de pagos</h2>
          <DataTable columns={paymentColumns} rows={purchase.payments} minWidth="760px" emptyTitle="Sin pagos" emptyDescription="Los pagos registrados apareceran aqui." />
        </Card>

        <Card className="xl:sticky xl:top-24 xl:self-start">
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Totales</h2>
          <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950/45">
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(purchase.subtotal))}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Impuesto</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(purchase.tax))}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-slate-500 dark:text-slate-400">Descuento</span><strong className="text-slate-900 dark:text-slate-100">{money.format(Number(purchase.discount))}</strong></div>
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
                <>
                  <FormField label="Cuenta bancaria" as="select" value={payment.bankAccountId} onChange={(value) => setPayment({ ...payment, bankAccountId: value })} required>
                    <option value="">Selecciona una cuenta</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.bankName} - {account.name} ({money.format(Number(account.currentBalance || 0))})
                      </option>
                    ))}
                  </FormField>
                  {bankAccounts.length === 0 && (
                    <AlertMessage type="info">No hay cuentas bancarias activas. Crea una cuenta en Banco para pagar por transferencia.</AlertMessage>
                  )}
                </>
              )}
              {payment.method === "CASH" && (
                <>
                  <FormField label="Caja" as="select" value={payment.cashBoxId} onChange={(value) => setPayment({ ...payment, cashBoxId: value })} required>
                    <option value="">Selecciona una caja</option>
                    {cashBoxes.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.name} ({money.format(Number(box.currentBalance || 0))})
                      </option>
                    ))}
                  </FormField>
                  {cashBoxes.length === 0 && (
                    <AlertMessage type="info">No hay cajas activas. Crea una caja en Caja Chica para pagar en efectivo.</AlertMessage>
                  )}
                </>
              )}
              <FormField label="Referencia" value={payment.reference} onChange={(value) => setPayment({ ...payment, reference: value })} />
              <FormField label="Fecha" type="date" value={payment.paymentDate} onChange={(value) => setPayment({ ...payment, paymentDate: value })} required />
              <FormField label="Notas" as="textarea" value={payment.notes} onChange={(value) => setPayment({ ...payment, notes: value })} />
              <Button type="submit" loading={saving} className="w-full">Registrar pago</Button>
            </form>
          ) : (
            <AlertMessage type="info">Esta compra no tiene balance pendiente para pago.</AlertMessage>
          )}
        </Card>
      </section>
    </div>
  );
}
