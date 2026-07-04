import { useEffect, useState } from "react";
import { Barcode, Boxes, DollarSign, Edit2, PackagePlus, Plus, Search, Trash2 } from "lucide-react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/productService";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getErrorMessage } from "../utils/errors";

const emptyProduct = { code: "", name: "", description: "", cost: 0, price: 0, stock: 0, minimumStock: 0 };
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProducts = async (query = search) => {
    setLoading(true);
    try {
      setProducts(await getProducts(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar productos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts("");
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await updateProduct(editingId, form);
      else await createProduct(form);
      setForm(emptyProduct);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar el producto"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({ ...product, cost: Number(product.cost), price: Number(product.price) });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar producto?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar el producto"));
    }
  };

  const productFields = [
    { key: "code", label: "Codigo", icon: Barcode, required: true },
    { key: "name", label: "Nombre del item", icon: PackagePlus, required: true },
    { key: "description", label: "Descripcion", full: true },
    { key: "cost", label: "Costo", icon: DollarSign, type: "number", required: true },
    { key: "price", label: "Precio de venta", icon: DollarSign, type: "number", required: true },
    { key: "stock", label: "Stock inicial", icon: Boxes, type: "number" },
    { key: "minimumStock", label: "Stock minimo", icon: Boxes, type: "number" }
  ];

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock" },
    { key: "cost", header: "Costo", render: (product) => money.format(product.cost) },
    { key: "price", header: "Precio", render: (product) => money.format(product.price) },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (product) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(product)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => remove(product.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalogo</p>
          <h1 className="text-3xl font-semibold text-slate-950">Productos</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadProducts(event.currentTarget.value)} placeholder="Nombre o codigo" className="w-64 outline-none" />
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{editingId ? "Actualizacion" : "Nuevo item"}</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-950">
              <PackagePlus size={19} />
              {editingId ? "Editar producto" : "Crear nuevo item"}
            </h2>
          </div>

          <div className="space-y-4 p-5">
            {productFields.map(({ key, label, icon: Icon, type = "text", required, full }) => (
              <div key={key} className={full ? "border-t border-slate-100 pt-4" : ""}>
                <div className="flex items-start gap-3">
                  {Icon && (
                    <span className="mt-7 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Icon size={17} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <FormField
                      label={label}
                      value={form[key]}
                      type={type}
                      min={0}
                      as={key === "description" ? "textarea" : "input"}
                      onChange={(value) => setForm({ ...form, [key]: value })}
                      required={required}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row">
              <Button type="submit" loading={saving} icon={Plus} className="sm:flex-1">
                {editingId ? "Guardar cambios" : "Guardar item"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-soft">Cargando productos...</div>
        ) : (
          <DataTable columns={columns} rows={products} minWidth="900px" emptyTitle="No hay productos" emptyDescription="Crea un producto o ajusta la busqueda." />
        )}
      </section>
    </div>
  );
}
