import { useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/productService";
import AlertMessage from "../components/AlertMessage";
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
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar producto" : "Crear producto"}</h2>
          {["code", "name", "description", "cost", "price", "stock", "minimumStock"].map((field) => (
            <FormField
              key={field}
              label={field}
              value={form[field]}
              type={["cost", "price", "stock", "minimumStock"].includes(field) ? "number" : "text"}
              min={0}
              onChange={(value) => setForm({ ...form, [field]: value })}
              required={["code", "name", "cost", "price"].includes(field)}
            />
          ))}
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}
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
