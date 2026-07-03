import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getProducts } from "../services/productService";
import { createPurchase } from "../services/purchaseService";
import { getSuppliers } from "../services/supplierService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const TAX_RATE = 0.18;

export default function CreatePurchase() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts()])
      .then(([supplierData, productData]) => {
        setSuppliers(supplierData);
        setProducts(productData);
        if (supplierData[0]) setSupplierId(supplierData[0].id);
        if (productData[0]) setSelectedProductId(productData[0].id);
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar datos para compras")))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.cost), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax - Number(discount || 0);
    return { subtotal, tax, discount: Number(discount || 0), total };
  }, [items, discount]);

  const addProduct = () => {
    const product = products.find((item) => String(item.id) === String(selectedProductId));
    if (!product) return;
    if (items.some((item) => item.productId === product.id)) {
      setError("El producto ya esta agregado a la compra");
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
        cost: Number(product.cost)
      }
    ]);
  };

  const updateItem = (productId, patch) => {
    setItems((current) => current.map((item) => (item.productId === productId ? { ...item, ...patch } : item)));
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!supplierId) return setError("Debe seleccionar un proveedor");
    if (items.length === 0) return setError("Debe agregar al menos un producto");
    if (Number(discount || 0) < 0) return setError("El descuento no puede ser negativo");
    if (totals.total < 0) return setError("El descuento no puede ser mayor que subtotal e impuestos");

    for (const item of items) {
      if (Number(item.quantity) <= 0) return setError("Las cantidades deben ser mayores que cero");
      if (Number(item.cost) < 0) return setError("Los costos no pueden ser negativos");
    }

    setSaving(true);
    try {
      const purchase = await createPurchase({
        supplierId,
        discount: totals.discount,
        notes,
        items: items.map((item) => ({ productId: item.productId, quantity: Number(item.quantity), cost: Number(item.cost) }))
      });
      navigate(`/purchases/${purchase.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible crear la compra"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock actual" },
    {
      key: "quantity",
      header: "Cantidad",
      render: (item) => (
        <input type="number" min={1} value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: event.target.value })} className="w-24 rounded-lg border border-slate-300 px-2 py-1 outline-none focus:border-accent" />
      )
    },
    {
      key: "cost",
      header: "Costo",
      render: (item) => (
        <input type="number" min={0} value={item.cost} onChange={(event) => updateItem(item.productId, { cost: event.target.value })} className="w-28 rounded-lg border border-slate-300 px-2 py-1 outline-none focus:border-accent" />
      )
    },
    { key: "total", header: "Total", render: (item) => money.format(Number(item.quantity) * Number(item.cost)) },
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
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Compras</p>
        <h1 className="text-3xl font-semibold text-slate-950">Crear compra</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <FormField label="Proveedor" as="select" value={supplierId} onChange={setSupplierId} required>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </FormField>
            <FormField label="Notas" as="textarea" value={notes} onChange={setNotes} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold">Productos</h2>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent">
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.code} - {product.name} | Stock: {product.stock}</option>
                ))}
              </select>
              <button type="button" onClick={addProduct} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
                <Plus size={18} />
                Agregar
              </button>
            </div>
            <DataTable columns={columns} rows={items} minWidth="840px" getRowKey={(row) => row.productId} emptyTitle="Sin productos" emptyDescription="Agrega productos para crear la compra." />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money.format(totals.subtotal)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Impuesto 18%</span><strong>{money.format(totals.tax)}</strong></div>
            <label className="block">
              <span className="text-slate-500">Descuento</span>
              <input type="number" min={0} value={discount} onChange={(event) => setDiscount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
            </label>
            <div className="border-t border-slate-200 pt-3">
              <div className="flex justify-between text-base"><span>Total</span><strong>{money.format(totals.total)}</strong></div>
            </div>
          </div>
          <button disabled={saving} className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60">
            {saving ? "Creando..." : "Crear compra"}
          </button>
        </aside>
      </section>
    </form>
  );
}
