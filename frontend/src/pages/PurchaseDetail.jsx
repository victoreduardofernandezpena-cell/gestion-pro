import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { cancelPurchase, createPurchasePayment, getPurchase } from "../services/purchaseService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, paymentMethodLabels, statusClass, statusLabels } from "../utils/format";

const emptyPayment = {
  amount: "",
  method: "CASH",
  reference: "",
  notes: "",
  paymentDate: new Date().toISOString().slice(0, 10)
};

export default function PurchaseDetail() {
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPurchase = async () => {
    setLoading(true);
    try {
      setPurchase(await getPurchase(id));
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

    setSaving(true);
    try {
      const result = await createPurchasePayment(purchase.id, { ...payment, amount });
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

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando compra...</div>;
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
    { key: "reference", header: "Referencia" },
    { key: "notes", header: "Notas" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Compra</p>
          <h1 className="text-3xl font-semibold text-slate-950">{purchase.purchaseNumber}</h1>
          <p className="mt-1 text-slate-500">{purchase.supplier?.name} | {formatDate(purchase.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/purchases" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Volver</Link>
          {canCancel && (
            <button type="button" onClick={cancel} disabled={saving} className="rounded-lg border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700 disabled:opacity-60">
              Cancelar compra
            </button>
          )}
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Estado</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[purchase.status]}`}>{statusLabels[purchase.status]}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Total</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(purchase.total))}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Pagado</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(purchase.paidAmount))}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Balance</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(purchase.balance))}</p></div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Productos comprados</h2>
        <DataTable columns={itemColumns} rows={purchase.items} minWidth="760px" emptyTitle="Sin productos" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Historial de pagos</h2>
          <DataTable columns={paymentColumns} rows={purchase.payments} minWidth="760px" emptyTitle="Sin pagos" emptyDescription="Los pagos registrados apareceran aqui." />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Totales</h2>
          <div className="mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money.format(Number(purchase.subtotal))}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Impuesto</span><strong>{money.format(Number(purchase.tax))}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Descuento</span><strong>{money.format(Number(purchase.discount))}</strong></div>
          </div>

          {canPay ? (
            <form onSubmit={submitPayment}>
              <h3 className="mb-3 font-semibold">Registrar pago</h3>
              <FormField label="Monto" type="number" min={0} value={payment.amount} onChange={(value) => setPayment({ ...payment, amount: value })} required />
              <FormField label="Metodo" as="select" value={payment.method} onChange={(value) => setPayment({ ...payment, method: value })} required>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </FormField>
              <FormField label="Referencia" value={payment.reference} onChange={(value) => setPayment({ ...payment, reference: value })} />
              <FormField label="Fecha" type="date" value={payment.paymentDate} onChange={(value) => setPayment({ ...payment, paymentDate: value })} required />
              <FormField label="Notas" as="textarea" value={payment.notes} onChange={(value) => setPayment({ ...payment, notes: value })} />
              <button disabled={saving} className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Registrando..." : "Registrar pago"}</button>
            </form>
          ) : (
            <AlertMessage type="info">Esta compra no tiene balance pendiente para pago.</AlertMessage>
          )}
        </div>
      </section>
    </div>
  );
}
