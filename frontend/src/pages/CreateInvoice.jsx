import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getClients } from "../services/clientService";
import { createInvoice } from "../services/invoiceService";
import { getProducts } from "../services/productService";
import { getDocumentSettings, getTaxes } from "../services/settingsService";
import { createLoyaltyAccount, findLoyaltyCredential, getClientLoyaltyAccount, getLoyaltySettings } from "../services/loyaltyService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientId, setClientId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [loyaltyCode, setLoyaltyCode] = useState("");
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [loyaltyRedeemAmount, setLoyaltyRedeemAmount] = useState(0);
  const [loyaltySettings, setLoyaltySettings] = useState(null);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0.18);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getClients(), getProducts(), getTaxes(), getDocumentSettings(), getLoyaltySettings()])
      .then(([clientData, productData, taxes, documentSettings, loyaltyConfig]) => {
        setClients(clientData);
        setProducts(productData);
        const defaultTax = taxes.find((tax) => tax.isDefault && tax.isActive);
        if (defaultTax) setTaxRate(Number(defaultTax.rate) / 100);
        if (documentSettings?.invoiceNotes) setNotes(documentSettings.invoiceNotes);
        setLoyaltySettings(loyaltyConfig);
        if (clientData[0]) setClientId(clientData[0].id);
        if (productData[0]) setSelectedProductId(productData[0].id);
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar datos para facturar")))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
    const tax = subtotal * taxRate;
    const loyaltyDiscount = Number(loyaltyRedeemAmount || 0);
    const maxLoyaltyRedeem = Math.max(subtotal - Number(discount || 0), 0);
    const total = subtotal + tax - Number(discount || 0) - loyaltyDiscount;
    return { subtotal, tax, discount: Number(discount || 0), loyaltyDiscount, maxLoyaltyRedeem, total };
  }, [items, discount, loyaltyRedeemAmount, taxRate]);

  const searchLoyaltyCredential = async () => {
    if (!loyaltyCode.trim()) return setError("Escribe o escanea una credencial");
    try {
      const account = await findLoyaltyCredential(loyaltyCode.trim().toUpperCase());
      setLoyaltyAccount(account);
      setClientId(account.clientId);
      setLoyaltyRedeemAmount(0);
      setError("");
    } catch (err) {
      setLoyaltyAccount(null);
      setError(getErrorMessage(err, "No se pudo buscar la credencial"));
    }
  };

  const associateSelectedClient = async () => {
    if (!clientId) return setError("Debe seleccionar un cliente");
    try {
      const account = await getClientLoyaltyAccount(clientId);
      setLoyaltyAccount(account);
      setLoyaltyCode(account.credentialCode);
      setLoyaltyRedeemAmount(0);
      setError("");
    } catch (err) {
      setLoyaltyAccount(null);
      setError(getErrorMessage(err, "Este cliente no tiene cuenta de fidelizacion"));
    }
  };

  const createLoyaltyForSelectedClient = async () => {
    if (!clientId) return setError("Debe seleccionar un cliente");
    try {
      const account = await createLoyaltyAccount(clientId);
      setLoyaltyAccount(account);
      setLoyaltyCode(account.credentialCode);
      setLoyaltyRedeemAmount(0);
      setError("");
      toast.success("Cliente agregado a fidelizacion");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear la cuenta de fidelizacion"));
      toast.error(getErrorMessage(err, "No se pudo crear la cuenta de fidelizacion"));
    }
  };

  const addProduct = () => {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    if (!product) return;
    if (items.some((item) => item.productId === product.id)) {
      setError("El producto ya esta agregado a la factura");
      return;
    }
    if (product.stock <= 0) {
      setError("Este producto no tiene stock disponible");
      return;
    }
    setError("");
    setItems((current) => [
      ...current,
      {
        productId: product.id,
        code: product.code,
        name: product.name,
        stock: product.stock,
        quantity: 1,
        price: Number(product.price)
      }
    ]);
  };

  const updateItem = (productId, patch) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        const next = { ...item, ...patch };
        if (Number(next.quantity) > item.stock) {
          setError(`No hay stock suficiente para ${item.name}. Disponible: ${item.stock}`);
          next.quantity = item.stock;
        } else {
          setError("");
        }
        return next;
      })
    );
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!clientId) return setError("Debe seleccionar un cliente");
    if (items.length === 0) return setError("Debe agregar al menos un producto");
    if (Number(discount || 0) < 0) return setError("El descuento no puede ser negativo");
    if (Number(loyaltyRedeemAmount || 0) < 0) return setError("El credito de fidelizacion no puede ser negativo");
    if (Number(loyaltyRedeemAmount || 0) > 0 && !loyaltyAccount) return setError("Debe buscar una credencial para usar credito");
    if (Number(loyaltyRedeemAmount || 0) > Number(loyaltyAccount?.moneyBalance || 0)) return setError("No puedes usar mas credito del balance disponible");
    if (Number(loyaltyRedeemAmount || 0) > totals.maxLoyaltyRedeem) return setError("El credito fidelidad solo aplica al monto de productos, no al impuesto");
    if (totals.total < 0) return setError("El descuento no puede ser mayor que subtotal e impuestos");

    for (const item of items) {
      if (Number(item.quantity) <= 0) return setError("Las cantidades deben ser mayores que cero");
      if (Number(item.quantity) > item.stock) return setError(`No hay stock suficiente para ${item.name}`);
      if (Number(item.price) < 0) return setError("Los precios no pueden ser negativos");
    }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        clientId,
        discount: totals.discount,
        loyaltyAccountId: loyaltyAccount?.id || null,
        loyaltyRedeemAmount: totals.loyaltyDiscount,
        notes,
        items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity), price: Number(item.price) }))
      });
      toast.success("Factura creada correctamente");
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "No fue posible crear la factura"));
      setError(getErrorMessage(err, "No fue posible crear la factura"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock" },
    {
      key: "quantity",
      header: "Cantidad",
      render: (item) => (
        <input
          type="number"
          min={1}
          max={item.stock}
          value={item.quantity}
          onChange={(event) => updateItem(item.productId, { quantity: event.target.value })}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1 outline-none focus:border-accent"
        />
      )
    },
    {
      key: "price",
      header: "Precio",
      render: (item) => (
        <input
          type="number"
          min={0}
          value={item.price}
          onChange={(event) => updateItem(item.productId, { price: event.target.value })}
          className="w-28 rounded-lg border border-slate-300 px-2 py-1 outline-none focus:border-accent"
        />
      )
    },
    { key: "total", header: "Total", render: (item) => money.format(Number(item.quantity) * Number(item.price)) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <button type="button" onClick={() => removeItem(item.productId)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar producto">
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando formulario...</div>;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Facturacion</p>
        <h1 className="text-3xl font-semibold text-slate-950">Crear factura</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <FormField label="Cliente" as="select" value={clientId} onChange={setClientId} required>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </FormField>
            <FormField label="Notas" as="textarea" value={notes} onChange={setNotes} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold">Cliente Fiel</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input value={loyaltyCode} onChange={(event) => setLoyaltyCode(event.target.value)} placeholder="Escanear o escribir credencial LF-000001" className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
              <button type="button" onClick={searchLoyaltyCredential} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Buscar credencial</button>
              <button type="button" onClick={associateSelectedClient} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Usar cliente</button>
              <button type="button" onClick={createLoyaltyForSelectedClient} className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 font-semibold text-teal-800">Crear cuenta fiel</button>
              <button type="button" onClick={() => navigate("/clientes")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Nuevo cliente</button>
            </div>
            {loyaltyAccount && (
              <div className="mt-4 rounded-lg bg-teal-50 p-4 text-sm text-teal-800">
                <p className="font-semibold">{loyaltyAccount.client?.name} | {loyaltyAccount.credentialCode}</p>
                <p>Balance disponible: {money.format(Number(loyaltyAccount.moneyBalance))}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold">Productos</h2>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent">
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} - {product.name} | Stock: {product.stock}</option>
                ))}
              </select>
              <Button variant="secondary" icon={Plus} onClick={addProduct}>Agregar</Button>
            </div>
            <DataTable columns={columns} rows={items} minWidth="840px" getRowKey={(row) => row.productId} emptyTitle="Sin productos" emptyDescription="Agrega productos para crear la factura." />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money.format(totals.subtotal)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Impuesto {Math.round(taxRate * 10000) / 100}%</span><strong>{money.format(totals.tax)}</strong></div>
            <label className="block">
              <span className="text-slate-500">Descuento</span>
              <input type="number" min={0} value={discount} onChange={(event) => setDiscount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
            </label>
            {loyaltySettings?.allowRedeem && (
              <label className="block">
                <span className="text-slate-500">Credito fidelidad</span>
                <input type="number" min={0} max={Math.min(Number(loyaltyAccount?.moneyBalance || 0), totals.maxLoyaltyRedeem)} value={loyaltyRedeemAmount} onChange={(event) => setLoyaltyRedeemAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
                <span className="mt-1 block text-xs text-slate-500">Maximo sin impuesto: {money.format(Math.min(Number(loyaltyAccount?.moneyBalance || 0), totals.maxLoyaltyRedeem))}</span>
              </label>
            )}
            {totals.loyaltyDiscount > 0 && <div className="flex justify-between"><span className="text-slate-500">Fidelidad aplicada</span><strong>{money.format(totals.loyaltyDiscount)}</strong></div>}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-base"><span>Total</span><strong>{money.format(totals.total)}</strong></div>
            </div>
          </div>
          <Button type="submit" loading={saving} className="mt-6 w-full" size="lg">Crear factura</Button>
        </aside>
      </section>
    </form>
  );
}
