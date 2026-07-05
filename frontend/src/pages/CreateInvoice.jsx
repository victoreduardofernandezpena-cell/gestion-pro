import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout, FormSection } from "../components/FormLayout";
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
  const [productSearch, setProductSearch] = useState("");
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

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => [product.code, product.name, product.sku, product.reference, product.barcode]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)));
  }, [productSearch, products]);

  useEffect(() => {
    if (filteredProducts.length > 0 && !filteredProducts.some((product) => String(product.id) === String(selectedProductId))) {
      setSelectedProductId(filteredProducts[0].id);
    }
    if (filteredProducts.length === 0 && selectedProductId) setSelectedProductId("");
  }, [filteredProducts, selectedProductId]);

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
          className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
          className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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

  if (loading) return <FormCard>Cargando formulario...</FormCard>;

  return (
    <form onSubmit={submit}>
      <FormPageLayout
        eyebrow="Facturacion"
        title="Crear factura"
        subtitle="Selecciona cliente, agrega productos, revisa totales y registra la venta con validaciones de stock."
        actions={<Button type="button" variant="outline" icon={ArrowLeft} onClick={() => navigate("/invoices")}>Volver</Button>}
      >

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <FormCard title="Cliente y documento" description="Define a nombre de quien se emitira la factura.">
            <FormGrid columns="xl:grid-cols-3">
              <FormField label="Cliente" as="select" value={clientId} onChange={setClientId} required className="xl:col-span-2">
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </FormField>
              <FormField label="Condicion" as="select" value="CREDITO" onChange={() => {}} disabled>
                <option value="CREDITO">Credito / pendiente</option>
              </FormField>
              <FormField label="Notas" as="textarea" value={notes} onChange={setNotes} className="xl:col-span-3" />
            </FormGrid>
          </FormCard>

          <FormCard title="Cliente Fiel" description="Escanea una credencial o asocia el cliente seleccionado al programa de puntos.">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                <Search size={18} className="text-slate-400" />
                <input value={loyaltyCode} onChange={(event) => setLoyaltyCode(event.target.value)} placeholder="Escanear o escribir credencial LF-000001" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
              </div>
              <Button type="button" variant="secondary" onClick={searchLoyaltyCredential}>Buscar</Button>
              <Button type="button" variant="outline" onClick={associateSelectedClient}>Usar cliente</Button>
              <Button type="button" variant="outline" onClick={createLoyaltyForSelectedClient}>Crear cuenta fiel</Button>
            </div>
            {loyaltyAccount && (
              <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/35 dark:text-teal-200">
                <p className="font-semibold">{loyaltyAccount.client?.name} | {loyaltyAccount.credentialCode}</p>
                <p>Balance disponible: {money.format(Number(loyaltyAccount.moneyBalance))}</p>
              </div>
            )}
          </FormCard>

          <FormCard title="Productos" description="Busca por codigo, nombre, SKU o referencia antes de agregar a la factura.">
            <FormSection title="Agregar item">
              <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)_auto]">
                <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                  <Search size={18} className="text-slate-400" />
                  <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar producto" className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" />
                </div>
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-900/40">
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.code} - {product.name} | Stock: {product.stock}</option>
                  ))}
                  {filteredProducts.length === 0 && <option value="">Sin productos encontrados</option>}
                </select>
                <Button type="button" variant="secondary" icon={Plus} onClick={addProduct} disabled={!selectedProductId || filteredProducts.length === 0}>Agregar</Button>
              </div>
            </FormSection>
            <DataTable columns={columns} rows={items} minWidth="840px" getRowKey={(row) => row.productId} emptyTitle="Sin productos" emptyDescription="Agrega productos para crear la factura." />
          </FormCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <FormCard title="Resumen" description="Revisa el total antes de crear la factura.">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><strong className="text-slate-950 dark:text-slate-100">{money.format(totals.subtotal)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Impuesto {Math.round(taxRate * 10000) / 100}%</span><strong className="text-slate-950 dark:text-slate-100">{money.format(totals.tax)}</strong></div>
              <FormField label="Descuento" type="number" min={0} value={discount} onChange={setDiscount} />
              {loyaltySettings?.allowRedeem && (
                <FormField
                  label="Credito fidelidad"
                  type="number"
                  min={0}
                  value={loyaltyRedeemAmount}
                  onChange={setLoyaltyRedeemAmount}
                  helper={`Maximo sin impuesto: ${money.format(Math.min(Number(loyaltyAccount?.moneyBalance || 0), totals.maxLoyaltyRedeem))}`}
                />
              )}
              {totals.loyaltyDiscount > 0 && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Fidelidad aplicada</span><strong className="text-slate-950 dark:text-slate-100">{money.format(totals.loyaltyDiscount)}</strong></div>}
              <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex justify-between text-base"><span className="text-slate-700 dark:text-slate-200">Total</span><strong className="text-xl text-slate-950 dark:text-slate-100">{money.format(totals.total)}</strong></div>
              </div>
            </div>
            <ActionBar>
              <Button type="submit" loading={saving} className="w-full" size="lg">Crear factura</Button>
            </ActionBar>
          </FormCard>

          <FormCard title="Control de stock">
            <div className="space-y-3 text-sm">
              {items.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">Agrega productos para validar disponibilidad.</p>
              ) : items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Disponible: {item.stock}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${Number(item.quantity) > item.stock ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
                    {Number(item.quantity) > item.stock ? "Revisar" : "OK"}
                  </span>
                </div>
              ))}
            </div>
          </FormCard>
        </aside>
      </section>
      </FormPageLayout>
    </form>
  );
}
