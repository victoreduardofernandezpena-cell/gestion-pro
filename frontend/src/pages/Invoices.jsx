import { Ban, Copy, CreditCard, Download, Eye, FileText, Mail, Plus, Printer, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout, FormSection, ModernCheckbox } from "../components/FormLayout";
import InvoicePaymentBreakdownModal from "../components/invoices/InvoicePaymentBreakdownModal";
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
      const rows = await getInvoices(buildInvoiceParams(filters));
      setInvoices(rows);
      setSelectedIds((current) => current.filter((id) => rows.some((invoice) => invoice.id === id)));
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

  const clearFilters = () => {
    setSearch(emptySearch);
    loadInvoices(emptySearch);
  };

  const toggleSelected = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleAll = () => {
    setSelectedIds((current) => current.length === invoices.length ? [] : invoices.map((invoice) => invoice.id));
  };

  const printBatch = async () => {
    if (selectedIds.length === 0) return setError("Selecciona al menos una factura para imprimir");
    for (const invoice of invoices.filter((item) => selectedIds.includes(item.id))) {
      await downloadPdf(invoice);
    }
    toast.success("Facturas seleccionadas enviadas a descarga");
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
      const message = getErrorMessage(err, "No fue posible duplicar la factura");
      setError(message);
      toast.error(message);
    }
  };

  const savePaymentBreakdown = async (payments) => {
    try {
      const result = await createInvoicePaymentBreakdown(paymentInvoice.id, payments);
      toast.success(result.change > 0 ? `Pago registrado. Devuelta: ${money.format(Number(result.change))}` : "Pago registrado");
      setPaymentInvoice(null);
      await loadInvoices(search);
    } catch (err) {
      const message = getErrorMessage(err, "No fue posible registrar el pago multiple");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <FormPageLayout
      eyebrow="Facturacion"
      title="Facturas"
      subtitle="Busca, crea, imprime y administra facturas del negocio desde un panel claro y consistente."
      actions={(
        <>
          <Button variant="outline" icon={Download} onClick={printBatch} disabled={selectedIds.length === 0}>Imprimir seleccionadas</Button>
          <Button icon={Plus} onClick={() => navigate("/invoices/new")}>Nueva factura</Button>
        </>
      )}
    >
      <div className="flex flex-wrap gap-2 text-sm font-semibold no-print">
        <Link to="/invoices" className="rounded-full bg-accent px-4 py-2 text-white shadow-sm">Buscar factura</Link>
        <Link to="/invoices/new" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Factura</Link>
        <button type="button" onClick={printBatch} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-slate-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" disabled={selectedIds.length === 0}>
          Imprimir facturas en lote
        </button>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <FormCard title="Filtros de busqueda" description="Filtra por fechas, cliente, documento, estatus o referencias comerciales. Los campos no disponibles aun quedan listos visualmente para fases posteriores.">
        <form onSubmit={submitSearch} className="space-y-6">
          <FormSection title="Datos principales">
            <FormGrid columns="xl:grid-cols-5">
              <FormField label="Id" value={search.id} onChange={(value) => updateSearch("id", value)} />
              <FormField label="Id tienda" value={search.storeId} onChange={(value) => updateSearch("storeId", value)} disabled />
              <FormField label="Fecha inicio" type="date" value={search.startDate} onChange={(value) => updateSearch("startDate", value)} />
              <FormField label="Fecha fin" type="date" value={search.endDate} onChange={(value) => updateSearch("endDate", value)} />
              <FormField label="Nombre completo" value={search.fullName} onChange={(value) => updateSearch("fullName", value)} />
            </FormGrid>
          </FormSection>

          <FormSection title="Documento">
            <FormGrid columns="xl:grid-cols-6">
              <FormField label="Cliente" value={search.client} onChange={(value) => updateSearch("client", value)} placeholder="Todos" />
              <FormField label="Item" value={search.item} onChange={(value) => updateSearch("item", value)} placeholder="Producto o codigo" />
              <FormField label="Serie" value={search.series} onChange={(value) => updateSearch("series", value)} />
              <FormField label="Documento" value={search.document} onChange={(value) => updateSearch("document", value)} />
              <FormField label="Tipo" as="select" value={search.type} onChange={(value) => updateSearch("type", value)}>
                <option value="">Todos</option>
                <option value="CONTADO">Contado</option>
                <option value="CREDITO">Credito</option>
                <option value="PROFORMA">Proforma</option>
              </FormField>
              <FormField label="NCF" value={search.ncf} onChange={(value) => updateSearch("ncf", value)} />
            </FormGrid>
          </FormSection>

          <FormSection title="Comercial">
            <FormGrid columns="xl:grid-cols-5">
              <FormField label="Tienda" value={search.store} onChange={(value) => updateSearch("store", value)} disabled />
              <FormField label="Vendedor" value={search.seller} onChange={(value) => updateSearch("seller", value)} placeholder="Todos" />
              <FormField label="Comprobante fiscal" value={search.fiscalReceipt} onChange={(value) => updateSearch("fiscalReceipt", value)} placeholder="Todos" />
              <FormField label="Moneda" as="select" value={search.currency} onChange={(value) => updateSearch("currency", value)}>
                <option value="">Todos</option>
                <option value="DOP">DOP</option>
              </FormField>
              <FormField label="Estatus" as="select" value={search.status} onChange={(value) => updateSearch("status", value)}>
                {statusOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}
              </FormField>
            </FormGrid>
          </FormSection>

          <FormSection title="Referencias">
            <FormGrid columns="xl:grid-cols-4">
              <FormField label="Id cotizacion" value={search.quotationId} onChange={(value) => updateSearch("quotationId", value)} />
              <FormField label="Id pre-factura" value={search.preInvoiceId} onChange={(value) => updateSearch("preInvoiceId", value)} />
              <FormField label="Id conduce" value={search.driverId} onChange={(value) => updateSearch("driverId", value)} />
              <FormField label="Id orden venta" value={search.orderId} onChange={(value) => updateSearch("orderId", value)} />
            </FormGrid>
          </FormSection>

          <FormSection title="Tipo de documento">
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <ModernCheckbox label="Normal" description="Facturas operativas actuales." checked={search.normal} onChange={(value) => updateSearch("normal", value)} />
              <ModernCheckbox label="Proforma" description="Preparado visualmente para fase posterior." checked={search.proforma} onChange={(value) => updateSearch("proforma", value)} />
            </div>
          </FormSection>

          <ActionBar>
            <Button type="submit" icon={Search} loading={loading}>Buscar</Button>
            <Button type="button" variant="secondary" icon={RotateCcw} onClick={clearFilters}>Limpiar filtros</Button>
            <Button type="button" variant="outline" icon={Plus} onClick={() => navigate("/invoices/new")}>Crear nuevo</Button>
            <Button type="button" variant="outline" icon={Printer} onClick={() => window.print()}>Imprimir vista</Button>
          </ActionBar>
        </form>
      </FormCard>

      <FormCard
        title="Resultado de busqueda"
        description={`${invoices.length} factura${invoices.length === 1 ? "" : "s"} encontrada${invoices.length === 1 ? "" : "s"}.`}
        actions={<Button variant="outline" size="sm" icon={Download} onClick={printBatch} disabled={selectedIds.length === 0}>Seleccionadas ({selectedIds.length})</Button>}
        className="print-area"
      >
        <div className="table-scroll overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 no-print"><input type="checkbox" checked={invoices.length > 0 && selectedIds.length === invoices.length} onChange={toggleAll} /></th>
                {["Factura", "Fecha", "Cliente", "Tipo", "NCF", "Total", "Cobrado", "Pendiente", "Estado", "Acciones"].map((header) => (
                  <th key={header} className="px-4 py-3 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-500">Buscando facturas...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={11} className="p-5"><EmptyState title="Sin facturas" description="Ajusta los filtros o crea una nueva factura." /></td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="transition hover:bg-teal-50/40 dark:hover:bg-slate-800/60">
                    <td className="px-4 py-3 no-print"><input type="checkbox" checked={selectedIds.includes(invoice.id)} onChange={() => toggleSelected(invoice.id)} /></td>
                    <td className="px-4 py-3 font-semibold text-slate-950 dark:text-slate-100">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(invoice.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{invoice.client?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Contado</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money.format(Number(invoice.total || 0))}</td>
                    <td className="px-4 py-3 text-right">{money.format(Number(invoice.paidAmount || 0))}</td>
                    <td className="px-4 py-3 text-right">{money.format(Number(invoice.balance || 0))}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[invoice.status]}`}>{statusLabels[invoice.status] || invoice.status}</span></td>
                    <td className="px-4 py-3 no-print">
                      <div className="flex items-center justify-end gap-2 text-slate-600 dark:text-slate-300">
                        <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} aria-label="Ver factura" title="Ver factura"><Eye size={16} /></button>
                        <button type="button" onClick={() => downloadPdf(invoice)} aria-label="Imprimir factura" title="Imprimir factura"><Printer size={16} /></button>
                        <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} aria-label="Detalle" title="Detalle"><FileText size={16} /></button>
                        {invoice.status !== "CANCELLED" && <button type="button" onClick={() => setConfirmDuplicate(invoice)} aria-label="Duplicar factura" title="Duplicar factura"><Copy size={16} /></button>}
                        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && <button type="button" onClick={() => setPaymentInvoice(invoice)} aria-label="Registrar pago" title="Registrar pago"><CreditCard size={16} /></button>}
                        <a href={`mailto:?subject=Factura ${invoice.invoiceNumber}`} aria-label="Enviar factura" title="Enviar factura"><Mail size={16} /></a>
                        {invoice.status === "CANCELLED" && <Ban size={16} />}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FormCard>

      <InvoicePaymentBreakdownModal invoice={paymentInvoice} bankAccounts={bankAccounts} cashBoxes={cashBoxes} onClose={() => setPaymentInvoice(null)} onSave={savePaymentBreakdown} />
      <ConfirmDialog
        open={Boolean(confirmDuplicate)}
        title="Duplicar factura"
        message={`Se creara una nueva factura con los mismos productos de ${confirmDuplicate?.invoiceNumber}, sin copiar pagos. Se validara stock nuevamente.`}
        confirmText="Duplicar"
        variant="primary"
        onCancel={() => setConfirmDuplicate(null)}
        onConfirm={() => runDuplicate(confirmDuplicate)}
      />
    </FormPageLayout>
  );
}
