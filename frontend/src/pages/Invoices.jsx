import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Mail, Printer } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { getInvoices } from "../services/invoiceService";
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

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState(emptySearch);
  const [appliedSearch, setAppliedSearch] = useState(emptySearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    try {
      setInvoices(await getInvoices(""));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar facturas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const normalize = (value) => String(value || "").toLowerCase().trim();
    const id = normalize(appliedSearch.id);
    const client = normalize(appliedSearch.client || appliedSearch.fullName);
    const ncf = normalize(appliedSearch.ncf || appliedSearch.document || appliedSearch.series);
    const start = appliedSearch.startDate ? new Date(`${appliedSearch.startDate}T00:00:00`) : null;
    const end = appliedSearch.endDate ? new Date(`${appliedSearch.endDate}T23:59:59`) : null;

    return invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      const invoiceText = normalize(`${invoice.id} ${invoice.invoiceNumber}`);
      const clientText = normalize(invoice.client?.name);

      if (id && !invoiceText.includes(id)) return false;
      if (client && !clientText.includes(client)) return false;
      if (ncf && !normalize(invoice.invoiceNumber).includes(ncf)) return false;
      if (appliedSearch.status && invoice.status !== appliedSearch.status) return false;
      if (start && createdAt < start) return false;
      if (end && createdAt > end) return false;
      return true;
    });
  }, [appliedSearch, invoices]);

  const updateSearch = (field, value) => {
    setSearch((current) => ({ ...current, [field]: value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(search);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-300 pb-5">
        <h1 className="text-3xl font-normal text-slate-950">Factura</h1>
      </div>

      <div className="border-b border-slate-300 pb-4 text-sm font-semibold">
        <span className="text-blue-800">Buscar Factura</span>
        <span className="mx-2 text-slate-400">|</span>
        <Link to="/invoices/new" className="text-slate-900">Factura</Link>
        <span className="mx-2 text-slate-400">|</span>
        <span className="text-slate-900">Imprimir Facturas en lote</span>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <form onSubmit={submitSearch} className="space-y-5">
        <section className="grid max-w-5xl gap-x-5 gap-y-3 text-xs md:grid-cols-[90px_90px_55px_90px_1fr]">
          <label className="self-center font-medium text-slate-700">Id</label>
          <input value={search.id} onChange={(event) => updateSearch("id", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <label className="self-center font-medium text-slate-700">Id Tienda</label>
          <input value={search.storeId} onChange={(event) => updateSearch("storeId", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner" />
          <span />

          <label className="self-center font-medium text-slate-700">Fecha Inicio</label>
          <input type="date" value={search.startDate} onChange={(event) => updateSearch("startDate", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <label className="self-center font-medium text-slate-700">Fecha Fin</label>
          <input type="date" value={search.endDate} onChange={(event) => updateSearch("endDate", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Nombre Completo</label>
          <input value={search.fullName} onChange={(event) => updateSearch("fullName", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent md:col-span-3" />
          <span />

          <label className="self-center font-medium text-slate-700">Cliente</label>
          <input value={search.client} onChange={(event) => updateSearch("client", event.target.value)} placeholder="Todos" className="h-9 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent md:col-span-3" />
          <span />

          <label className="self-center font-medium text-slate-700">Item</label>
          <input value={search.item} onChange={(event) => updateSearch("item", event.target.value)} disabled placeholder="Todos" className="h-9 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner md:col-span-3" />
          <span />

          <label className="self-center font-medium text-slate-700">Serie</label>
          <input value={search.series} onChange={(event) => updateSearch("series", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <label className="self-center font-medium text-slate-700">Documento</label>
          <input value={search.document} onChange={(event) => updateSearch("document", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Tipo</label>
          <select value={search.type} onChange={(event) => updateSearch("type", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2">
            <option>Todos</option>
          </select>
          <label className="self-center font-medium text-slate-700">NCF</label>
          <input value={search.ncf} onChange={(event) => updateSearch("ncf", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent" />
          <span />

          <label className="self-center font-medium text-slate-700">Tienda</label>
          <div className="flex h-9 items-center rounded border border-cyan-200 bg-white px-2 shadow-inner md:col-span-3">
            <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-slate-700">x&nbsp; {search.store}</span>
          </div>
          <span />

          <label className="self-center font-medium text-slate-700">Vendedor</label>
          <input value={search.seller} onChange={(event) => updateSearch("seller", event.target.value)} disabled placeholder="Todos" className="h-9 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner md:col-span-3" />
          <span />

          <label className="self-center font-medium text-slate-700">Comprobante Fiscal</label>
          <input value={search.fiscalReceipt} onChange={(event) => updateSearch("fiscalReceipt", event.target.value)} disabled placeholder="Todos" className="h-9 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner md:col-span-3" />
          <span />

          <label className="self-center font-medium text-slate-700">Moneda</label>
          <select value={search.currency} onChange={(event) => updateSearch("currency", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2">
            <option>Todos</option>
          </select>
          <span className="md:col-span-3" />

          <label className="self-center font-medium text-slate-700">Id Cotizacion</label>
          <input value={search.quotationId} onChange={(event) => updateSearch("quotationId", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner" />
          <label className="self-center font-medium text-slate-700">Id Pre-Factura</label>
          <input value={search.preInvoiceId} onChange={(event) => updateSearch("preInvoiceId", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner" />
          <label className="self-center font-medium text-slate-700 md:ml-4">Id Conduce</label>
          <input value={search.driverId} onChange={(event) => updateSearch("driverId", event.target.value)} disabled className="h-8 rounded border border-cyan-200 bg-slate-50 px-2 shadow-inner" />

          <label className="self-center font-medium text-slate-700">Estatus</label>
          <select value={search.status} onChange={(event) => updateSearch("status", event.target.value)} className="h-8 rounded border border-cyan-200 bg-white px-2 shadow-inner outline-none focus:border-accent">
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>{option.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={search.normal} onChange={(event) => updateSearch("normal", event.target.checked)} disabled />
            Normal
          </label>
          <label className="flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={search.proforma} onChange={(event) => updateSearch("proforma", event.target.checked)} disabled />
            Proforma
          </label>
        </section>

        <div className="border-t border-slate-300 pt-4">
          <div className="ml-0 flex gap-1 md:ml-[82px]">
            <button type="submit" className="rounded bg-cyan-500 px-5 py-2 text-sm font-bold text-white shadow hover:bg-cyan-600">Buscar</button>
            <button type="button" onClick={() => navigate("/invoices/new")} className="rounded bg-cyan-500 px-5 py-2 text-sm font-bold text-white shadow hover:bg-cyan-600">Crear Nuevo</button>
          </div>
        </div>
      </form>

      <section>
        <h2 className="border-b border-slate-300 pb-4 text-sm font-bold text-blue-800">Resultado de Busqueda</h2>
        <div className="table-scroll mt-4 overflow-x-auto border border-slate-200 bg-white">
          <table className="min-w-[1120px] w-full border-collapse text-xs">
            <thead className="bg-cyan-50 text-left text-slate-900">
              <tr>
                {["ID", "Fecha", "Tienda", "Cliente", "NCF", "Tipo", "Estatus", "Monto", "Descuento", "Impuesto", "Total", ""].map((header) => (
                  <th key={header} className="border border-slate-200 px-3 py-2 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-500">Cargando facturas...</td></tr>
              ) : filteredInvoices.length === 0 ? (
                <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-500">No hay facturas con esos filtros.</td></tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="odd:bg-white even:bg-slate-50 hover:bg-cyan-50/60">
                    <td className="border border-slate-200 px-3 py-2">{invoice.id}</td>
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
                    <td className="border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-end gap-2 text-slate-600">
                        <button type="button" onClick={() => navigate(`/invoices/${invoice.id}`)} aria-label="Ver factura"><Eye size={15} /></button>
                        <Printer size={15} />
                        <FileText size={15} />
                        <Mail size={15} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
