import { useEffect, useState } from "react";
import { Ban, Copy, CreditCard, Download, Eye, FileText, Mail, Plus, Printer, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { getBankAccounts } from "../services/bankService";
import { getCashBoxes } from "../services/cashBoxService";
import { createInvoicePaymentBreakdown, duplicateInvoice, getInvoices } from "../services/invoiceService";
import { downloadInvoicePdf } from "../services/reportService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";

const statusOptions = [
  { label: "Todos", value: "" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Parcial", value: "PARTIAL" },
  { label: "Cobrada", value: "PAID" },
  { label: "Anulada", value: "CANCELLED" }
];

const emptySearch = {
  id: "",
  storeId: "",
  startDate: "",
  endDate: "",
  fullName: "",
  client: "",
  item: "",
  series: "",
  document: "",
  type: "",
  ncf: "",
  store: "Tienda Principal",
  seller: "",
  fiscalReceipt: "",
  currency: "",
  quotationId: "",
  preInvoiceId: "",
  driverId: "",
  orderId: "",
  status: "",
  normal: true,
  proforma: false
};

const compactInput = "h-7 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100";
const wideInput = `${compactInput} md:col-span-4`;
const mutedInput = "h-7 rounded border border-cyan-200 bg-slate-50 px-2 text-xs text-slate-500 shadow-inner";

const buildInvoiceParams = (filters) => {
  const invoiceText = [filters.ncf, filters.document, filters.series].filter(Boolean).join(" ").trim();
  return {
    ...(filters.id ? { id: filters.id } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.client || filters.fullName ? { client: filters.client || filters.fullName } : {}),
    ...(filters.item ? { item: filters.item } : {}),
    ...(invoiceText ? { text: invoiceText } : {}),
    ...(filters.status ? { status: filters.status } : {})
  };
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState(emptySearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);

  const loadInvoices = async (filters = search) => {
    setLoading(true);
    try {
      setInvoices(await getInvoices(buildInvoiceParams(filters)));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar facturas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices(emptySearch);
    Promise.all([getBankAccounts(), getCashBoxes()])
      .then(([banks, boxes]) => {
        setBankAccounts(banks.filter((item) => item.isActive));
        setCashBoxes(boxes.filter((item) => item.isActive));
      })
      .catch(() => {
        setBankAccounts([]);
        setCashBoxes([]);
      });
  }, []);

  const updateSearch = (field, value) => {
    setSearch((current) => ({ ...current, [field]: value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    loadInvoices(search);
  };

  const printBatch = async () => {
    if (selectedIds.length === 0) return setError("Selecciona al menos una factura para imprimir");
    for (const invoice of invoices.filter((item) => selectedIds.includes(item.id))) {
      await downloadPdf(invoice);
    }
    toast.success("Facturas seleccionadas enviadas a descarga");
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelectedIds((current) => current.length === invoices.length ? [] : invoices.map((invoice) => invoice.id));
  };

  const printVisible = () => {
    window.print();
  };

  const downloadPdf = async (invoice) => {
    try {
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible descargar el PDF"));
    }
  };

  const runDuplicate = async (invoice) => {
    try {
      const duplicated = await duplicateInvoice(invoice.id);
      toast.success(`Factura duplicada: ${duplicated.invoiceNumber}`);
      setConfirmDuplicate(null);
      await loadInvoices(search);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible duplicar la factura"));
      toast.error(getErrorMessage(err, "No fue posible duplicar la factura"));
    }
  };

  const savePaymentBreakdown = async (payments) => {
    try {
      const result = await createInvoicePaymentBreakdown(paymentInvoice.id, payments);
      toast.success(result.change > 0 ? `Pago registrado. Devuelta: ${money.format(Number(result.change))}` : "Pago registrado");
      setPaymentInvoice(null);
      await loadInvoices(search);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible registrar el pago multiple"));
      toast.error(getErrorMessage(err, "No fue posible registrar el pago multiple"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-300 pb-5">
        <h1 className="text-3xl font-normal text-slate-950">Factura</h1>
      </div>

      <div className="border-b border-slate-300 pb-4 text-sm font-semibold">
        <span className="text-blue-800">Buscar Factura</span>
        <span className="mx-2 text-slate-400">|</span>
        <Link to="/invoices/new" className="text-slate-900">Factura</Link>
        <span className="mx-2 text-slate-400">|</span>
        <button type="button" onClick={printBatch} className="font-semibold text-slate-900">Imprimir Facturas en lote</button>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <form onSubmit={submitSearch} className="space-y-5">
        <section className="grid max-w-3xl gap-x-5 gap-y-3 text-xs md:grid-cols-[100px_70px_70px_70px_1fr]">
          <label className="self-center font-medium text-slate-700">Id</label>
          <input value={search.id} onChange={(event) => updateSearch("id", event.target.value)} className={compactInput} />
          <label className="self-center font-medium text-slate-700">Id Tienda</label>
          <input value={search.storeId} onChange={(event) => updateSearch("storeId", event.target.value)} className={mutedInput} />
          <span />

          <label className="self-center font-medium text-slate-700">Fecha Inicio</label>
          <input type="date" value={search.startDate} onChange={(event) => updateSearch("startDate", event.target.value)} className="h-7 w-32 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent" />
          <label className="self-center font-medium text-slate-700">Fecha Fin</label>
          <input type="date" value={search.endDate} onChange={(event) => updateSearch("endDate", event.target.value)} className="h-7 w-32 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Nombre Completo</label>
          <input value={search.fullName} onChange={(event) => updateSearch("fullName", event.target.value)} className={wideInput} />

          <label className="self-center font-medium text-slate-700">Cliente</label>
          <input value={search.client} onChange={(event) => updateSearch("client", event.target.value)} placeholder="Todos" className={wideInput} />

          <label className="self-center font-medium text-slate-700">Item</label>
          <input value={search.item} onChange={(event) => updateSearch("item", event.target.value)} placeholder="Todos" className={wideInput} />

          <label className="self-center font-medium text-slate-700">Serie</label>
          <input value={search.series} onChange={(event) => updateSearch("series", event.target.value)} className="h-7 w-40 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent" />
          <label className="self-center font-medium text-slate-700">Documento</label>
          <input value={search.document} onChange={(event) => updateSearch("document", event.target.value)} className="h-7 w-40 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Tipo</label>
          <select value={search.type} onChange={(event) => updateSearch("type", event.target.value)} className="h-7 w-20 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent">
            <option value="">Todos</option>
            <option value="CONTADO">Contado</option>
          </select>
          <label className="self-center font-medium text-slate-700">NCF</label>
          <input value={search.ncf} onChange={(event) => updateSearch("ncf", event.target.value)} className="h-7 w-32 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Tienda</label>
          <div className="flex h-9 items-center rounded border border-cyan-200 bg-white px-2 shadow-inner md:col-span-4">
            <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700">x&nbsp; {search.store}</span>
          </div>

          <label className="self-center font-medium text-slate-700">Vendedor</label>
          <input value={search.seller} onChange={(event) => updateSearch("seller", event.target.value)} placeholder="Todos" className={wideInput} />

          <label className="self-center font-medium text-slate-700">Comprobante Fiscal</label>
          <input value={search.fiscalReceipt} onChange={(event) => updateSearch("fiscalReceipt", event.target.value)} placeholder="Todos" className={wideInput} />

          <label className="self-center font-medium text-slate-700">Moneda</label>
          <select value={search.currency} onChange={(event) => updateSearch("currency", event.target.value)} className="h-7 w-32 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent">
            <option value="">Todos</option>
            <option value="DOP">DOP</option>
          </select>
          <span className="md:col-span-3" />

          <label className="self-center font-medium text-slate-700">Id Cotizacion</label>
          <input value={search.quotationId} onChange={(event) => updateSearch("quotationId", event.target.value)} className={compactInput} />
          <label className="self-center font-medium text-slate-700">Id Pre-Factura</label>
          <input value={search.preInvoiceId} onChange={(event) => updateSearch("preInvoiceId", event.target.value)} className={compactInput} />
          <label className="self-center font-medium text-slate-700">Id Conduce</label>
          <input value={search.driverId} onChange={(event) => updateSearch("driverId", event.target.value)} className={compactInput} />

          <label className="self-center font-medium text-slate-700">Id Orden Venta</label>
          <input value={search.orderId} onChange={(event) => updateSearch("orderId", event.target.value)} className={compactInput} />
          <label className="self-center font-medium text-slate-700">Estatus</label>
          <select value={search.status} onChange={(event) => updateSearch("status", event.target.value)} className="h-7 w-28 rounded border border-cyan-200 bg-white px-2 text-xs shadow-inner outline-none focus:border-accent">
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span />
          <span />

          <span />
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={search.normal} onChange={(event) => updateSearch("normal", event.target.checked)} />
            Normal
          </label>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={search.proforma} onChange={(event) => updateSearch("proforma", event.target.checked)} />
            Proforma
          </label>
        </section>

        <div className="border-t border-slate-300 pt-4">
          <div className="ml-0 flex gap-1 md:ml-[100px]">
            <button type="submit" className="rounded bg-cyan-500 px-5 py-2 text-sm font-bold text-white shadow hover:bg-cyan-600 disabled:opacity-60" disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
            <button type="button" onClick={() => navigate("/invoices/new")} className="rounded bg-cyan-500 px-5 py-2 text-sm font-bold text-white shadow hover:bg-cyan-600">Crear Nuevo</button>
            <button type="button" onClick={printVisible} className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-50">Imprimir vista</button>
          </div>
        </div>
      </form>

      <section className="print-area">
        <h2 className="border-b border-slate-300 pb-4 text-sm font-bold text-blue-800">Resultado de Busqueda</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 no-print">
          <Button variant="outline" size="sm" icon={Download} onClick={printBatch} disabled={selectedIds.length === 0}>Imprimir seleccionadas ({selectedIds.length})</Button>
        </div>
        <div className="table-scroll mt-4 overflow-x-auto border border-slate-200 bg-white">
          <table className="min-w-[1320px] w-full border-collapse text-xs">
            <thead className="bg-cyan-50 text-left text-slate-900">
              <tr>
                <th className="border border-slate-200 px-3 py-2 font-bold no-print"><input type="checkbox" checked={invoices.length > 0 && selectedIds.length === invoices.length} onChange={toggleAll} /></th>
                {["Factura", "Fecha", "Tienda", "Cliente", "NCF", "Tipo", "Estatus", "Monto", "Descuento", "Impuesto", "Total", "Cobrado", "Balance", ""].map((header) => (
                  <th key={header} className="border border-slate-200 px-3 py-2 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={15} className="px-3 py-6 text-center text-slate-500">Cargando facturas...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={15} className="px-3 py-6 text-center text-slate-500">No hay facturas con esos filtros.</td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="odd:bg-white even:bg-slate-50 hover:bg-cyan-50/60">
                    <td className="border border-slate-200 px-3 py-2 no-print"><input type="checkbox" checked={selectedIds.includes(invoice.id)} onChange={() => toggleSelected(invoice.id)} /></td>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">{invoice.invoiceNumber}</td>
                    <td className="border border-slate-200 px-3 py-2">{formatDate(invoice.createdAt)}</td>
                    <td className="border border-slate-200 px-3 py-2">Tienda Principal</td>
                    <td className="border border-slate-200 px-3 py-2">{invoice.client?.name}</td>
                    <td className="border border-slate-200 px-3 py-2">{invoice.invoiceNumber}</td>
                    <td className="border border-slate-200 px-3 py-2">Contado</td>
                    <td className="border border-slate-200 px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusClass[invoice.status]}`}>{statusLabels[invoice.status]}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.subtotal))}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.discount))}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.tax))}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.total))}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.paidAmount || 0))}</td>
                    <td className="border border-slate-200 px-3 py-2 text-right">{money.format(Number(invoice.balance || 0))}</td>
                    <td className="border border-slate-200 px-3 py-2 no-print">
                      <div className="flex items-center justify-end gap-2 text-slate-600">
                        <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} aria-label="Ver factura" title="Ver factura"><Eye size={15} /></button>
                        <button type="button" onClick={() => downloadPdf(invoice)} aria-label="Imprimir factura" title="Imprimir factura"><Printer size={15} /></button>
                        <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} aria-label="Detalle" title="Detalle"><FileText size={15} /></button>
                        {invoice.status !== "CANCELLED" && <button type="button" onClick={() => setConfirmDuplicate(invoice)} aria-label="Duplicar factura" title="Duplicar factura"><Copy size={15} /></button>}
                        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && <button type="button" onClick={() => setPaymentInvoice(invoice)} aria-label="Registrar pago" title="Registrar pago"><CreditCard size={15} /></button>}
                        <a href={`mailto:?subject=Factura ${invoice.invoiceNumber}`} aria-label="Enviar factura" title="Enviar factura"><Mail size={15} /></a>
                        {invoice.status === "CANCELLED" && <Ban size={15} />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <InvoicePaymentBreakdownModal
        invoice={paymentInvoice}
        bankAccounts={bankAccounts}
        cashBoxes={cashBoxes}
        onClose={() => setPaymentInvoice(null)}
        onSave={savePaymentBreakdown}
      />
      <ConfirmDialog
        open={Boolean(confirmDuplicate)}
        title="Duplicar factura"
        message={`Se creara una nueva factura con los mismos productos de ${confirmDuplicate?.invoiceNumber}, sin copiar pagos. Se validara stock nuevamente.`}
        confirmText="Duplicar"
        variant="primary"
        onCancel={() => setConfirmDuplicate(null)}
        onConfirm={() => runDuplicate(confirmDuplicate)}
      />
    </div>
  );
}

function InvoicePaymentBreakdownModal({ invoice, bankAccounts, cashBoxes, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [payments, setPayments] = useState([{ method: "CASH", amount: "", reference: "", paymentDate: today, cashBoxId: "", bankAccountId: "" }]);

  useEffect(() => {
    if (invoice) setPayments([{ method: "CASH", amount: Number(invoice.balance || 0), reference: "", paymentDate: today, cashBoxId: cashBoxes[0]?.id || "", bankAccountId: "" }]);
  }, [invoice, cashBoxes]);

  if (!invoice) return null;

  const totalFactura = Number(invoice.total || 0);
  const totalCobrado = Number(invoice.paidAmount || 0);
  const falta = Number(invoice.balance || 0);
  const totalRecibido = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const devuelta = Math.max(totalRecibido - falta, 0);

  const updatePayment = (index, field, value) => {
    setPayments((current) => current.map((payment, currentIndex) => currentIndex === index ? { ...payment, [field]: value } : payment));
  };

  const addPayment = () => {
    setPayments((current) => [...current, { method: "CASH", amount: "", reference: "", paymentDate: today, cashBoxId: cashBoxes[0]?.id || "", bankAccountId: "" }]);
  };

  const removePayment = (index) => {
    setPayments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(payments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount || 0),
      reference: payment.reference,
      paymentDate: payment.paymentDate,
      cashBoxId: payment.method === "CASH" ? payment.cashBoxId : null,
      bankAccountId: payment.method === "BANK_TRANSFER" ? payment.bankAccountId : null
    })));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Pago multiple</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{invoice.invoiceNumber}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">Cerrar</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <PaymentMetric label="Total factura" value={totalFactura} />
          <PaymentMetric label="Total cobrado" value={totalCobrado} />
          <PaymentMetric label="Falta por cobrar" value={falta} />
          <PaymentMetric label="Devuelta" value={devuelta} />
        </div>
        <div className="mt-5 space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[140px_120px_1fr_150px_150px_auto] dark:border-slate-700">
              <select value={payment.method} onChange={(event) => updatePayment(index, "method", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="CASH">Efectivo</option>
                <option value="BANK_TRANSFER">Transferencia</option>
                <option value="CARD">Tarjeta</option>
                <option value="CHECK">Cheque/deposito</option>
                <option value="OTHER">Otro</option>
              </select>
              <input type="number" min={0.01} step="0.01" value={payment.amount} onChange={(event) => updatePayment(index, "amount", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input value={payment.reference} onChange={(event) => updatePayment(index, "reference", event.target.value)} placeholder="Referencia" className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              {payment.method === "CASH" ? (
                <select value={payment.cashBoxId} onChange={(event) => updatePayment(index, "cashBoxId", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Caja</option>
                  {cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name}</option>)}
                </select>
              ) : payment.method === "BANK_TRANSFER" ? (
                <select value={payment.bankAccountId} onChange={(event) => updatePayment(index, "bankAccountId", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Banco</option>
                  {bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              ) : <span className="hidden md:block" />}
              <input type="date" value={payment.paymentDate} onChange={(event) => updatePayment(index, "paymentDate", event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <button type="button" onClick={() => removePayment(index)} className="grid h-10 w-10 place-items-center rounded-lg border border-rose-200 text-rose-600" aria-label="Eliminar pago"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <Button type="button" variant="outline" icon={Plus} onClick={addPayment}>Agregar pago</Button>
          <Button type="submit" icon={CreditCard}>Registrar pagos</Button>
        </div>
      </form>
    </div>
  );
}

function PaymentMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{money.format(Number(value || 0))}</p>
    </div>
  );
}
