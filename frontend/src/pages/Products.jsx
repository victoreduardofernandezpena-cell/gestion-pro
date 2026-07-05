import { useEffect, useState } from "react";
import { Camera, Edit2, Save, Search, Trash2, X } from "lucide-react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/productService";
import { getBrands } from "../services/brandService";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { getErrorMessage } from "../utils/errors";
import { getCategories } from "../services/settingsService";

const emptyProduct = {
  code: "",
  name: "",
  description: "",
  itemType: "",
  status: "Activo",
  barcode: "",
  reference: "",
  sku: "",
  category: "",
  subcategory: "",
  family: "",
  brand: "",
  brandId: "",
  unit: "",
  isComposite: false,
  requiresLot: false,
  requiresSerial: false,
  requiresExpiration: false,
  imageName: "",
  cost: 0,
  price: 0,
  stock: 0,
  minimumStock: 0
};
const emptyMeta = {
  imagePreview: ""
};
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Products() {
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [meta, setMeta] = useState(emptyMeta);
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
    getCategories("PRODUCT")
      .then((rows) => setProductTypes(rows.filter((row) => row.isActive)))
      .catch(() => setProductTypes([]));
    getBrands()
      .then((rows) => setBrands(rows.filter((row) => row.isActive)))
      .catch(() => setBrands([]));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.itemType) {
      setError("Debe seleccionar un tipo de item. El admin puede crearlo en Configuracion > Categorias con tipo Producto.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) await updateProduct(editingId, form);
      else await createProduct(form);
      setForm(emptyProduct);
      setMeta(emptyMeta);
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
    setForm({
      ...emptyProduct,
      ...product,
      cost: Number(product.cost),
      price: Number(product.price),
      stock: Number(product.stock),
      minimumStock: Number(product.minimumStock)
    });
    setMeta(emptyMeta);
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

  const updateMeta = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setMeta(emptyMeta);
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((current) => ({ ...current, imageName: "" }));
      setMeta(emptyMeta);
      return;
    }
    setForm((current) => ({ ...current, imageName: file.name }));
    setMeta((current) => ({ ...current, imagePreview: URL.createObjectURL(file) }));
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

      <section className="space-y-6">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <div className="grid gap-x-6 gap-y-3 md:grid-cols-[90px_minmax(0,260px)_1fr]">
                <span className="self-center text-xs font-medium text-slate-700">Id</span>
                <span className="self-center text-sm font-semibold text-slate-900">{editingId || "Nuevo"}</span>

                <span className="hidden md:block" />
                <span className="self-center text-xs font-medium text-slate-700">Nombre</span>
                <div className="flex items-center gap-2">
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className="min-h-9 w-full rounded border border-cyan-200 bg-white px-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="text-red-600">*</span>
                </div>

                <span className="hidden md:block" />
                <span className="self-start pt-2 text-xs font-medium text-slate-700">Descripcion</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full rounded border border-cyan-200 bg-white px-2 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />

                <span className="hidden md:block" />
                <span className="self-center text-xs font-medium text-slate-700">Precio</span>
                <input type="number" min={0} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required className="min-h-9 w-36 rounded border border-cyan-200 bg-white px-2 text-right text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />

                <span className="hidden md:block" />
                <span className="self-center text-xs font-medium text-slate-700">Tipo de item</span>
                <div className="flex flex-wrap items-center gap-4">
                  <select value={form.itemType} onChange={(event) => setForm({ ...form, itemType: event.target.value })} required className="min-h-9 w-48 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    {productTypes.map((type) => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                  <span className="text-red-600">*</span>
                  <span className="text-xs font-medium text-slate-700">Estatus</span>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="min-h-9 w-28 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <h2 className="border-b border-slate-300 pb-3 text-sm font-bold text-blue-800">Codificacion</h2>
                <div className="mt-4 grid gap-x-5 gap-y-3 md:grid-cols-[90px_130px_28px_80px_150px_40px_120px]">
                  <span className="self-center text-xs font-medium text-slate-700">Codigo de barra</span>
                  <input value={form.barcode} onChange={(event) => updateMeta("barcode", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="self-center text-center text-xl text-slate-300">+</span>
                  <span className="self-center text-xs font-medium text-slate-700">Referencia</span>
                  <input value={form.reference} onChange={(event) => updateMeta("reference", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="self-center text-xs font-medium text-slate-700">SKU</span>
                  <input value={form.sku} onChange={(event) => updateMeta("sku", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="self-center text-xs font-medium text-slate-700">Codigo</span>
                  <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                </div>
              </div>

              <div>
                <h2 className="border-b border-slate-300 pb-3 text-sm font-bold text-blue-800">Categorizacion</h2>
                <div className="mt-4 grid gap-x-5 gap-y-3 md:grid-cols-[90px_130px_80px_90px_60px_90px]">
                  <span className="self-center text-xs font-medium text-slate-700">Categoria</span>
                  <select value={form.category} onChange={(event) => updateMeta("category", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    <option value="PRODUCTO">PRODUCTO</option>
                    <option value="SERVICIO">SERVICIO</option>
                    <option value="REPUESTO">REPUESTO</option>
                  </select>
                  <span className="self-center text-xs font-medium text-slate-700">SubCategoria</span>
                  <select value={form.subcategory} onChange={(event) => updateMeta("subcategory", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    <option value="General">General</option>
                    <option value="Motor">Motor</option>
                    <option value="Accesorio">Accesorio</option>
                  </select>
                  <span className="self-center text-xs font-medium text-slate-700">Familia</span>
                  <select value={form.family} onChange={(event) => updateMeta("family", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    <option value="Principal">Principal</option>
                    <option value="Secundaria">Secundaria</option>
                  </select>

                  <span className="self-center text-xs font-medium text-slate-700">Marca</span>
                  <select value={form.brandId || ""} onChange={(event) => {
                    const brand = brands.find((item) => String(item.id) === event.target.value);
                    setForm({ ...form, brandId: event.target.value, brand: brand?.name || "" });
                  }} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                  <span className="self-center text-xs font-medium text-slate-700">Item Unidad</span>
                  <select value={form.unit} onChange={(event) => updateMeta("unit", event.target.value)} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-sm text-slate-700 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100">
                    <option value=""></option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                  </select>
                </div>
              </div>

              <div>
                <h2 className="border-b border-slate-300 pb-3 text-sm font-bold text-blue-800">Inventario</h2>
                <div className="mt-4 grid gap-x-5 gap-y-3 md:grid-cols-[90px_130px_90px_130px]">
                  <span className="self-center text-xs font-medium text-slate-700">Costo</span>
                  <input type="number" min={0} value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} required className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-right text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="self-center text-xs font-medium text-slate-700">Stock inicial</span>
                  <input type="number" min={0} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-right text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                  <span className="self-center text-xs font-medium text-slate-700">Stock minimo</span>
                  <input type="number" min={0} value={form.minimumStock} onChange={(event) => setForm({ ...form, minimumStock: event.target.value })} className="min-h-9 rounded border border-cyan-200 bg-white px-2 text-right text-sm text-slate-900 shadow-inner outline-none focus:border-accent focus:ring-2 focus:ring-teal-100" />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.isComposite} onChange={(event) => setForm({ ...form, isComposite: event.target.checked })} /> Compuesto</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.requiresLot} onChange={(event) => setForm({ ...form, requiresLot: event.target.checked })} /> Requiere lote</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.requiresSerial} onChange={(event) => setForm({ ...form, requiresSerial: event.target.checked })} /> Requiere serie</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={form.requiresExpiration} onChange={(event) => setForm({ ...form, requiresExpiration: event.target.checked })} /> Tiene vencimiento</label>
                </div>
              </div>
            </div>

            <aside className="flex flex-col items-center justify-start gap-4 pt-10">
              <div className="flex h-28 w-32 flex-col items-center justify-center text-center text-xs font-semibold text-slate-500">
                {meta.imagePreview ? (
                  <img src={meta.imagePreview} alt="" className="h-full w-full rounded object-cover" />
                ) : (
                  <>
                    <Camera size={50} className="mb-1 text-slate-400" />
                    Imagen<br />No Disponible
                  </>
                )}
              </div>
              <div className="grid w-full grid-cols-[60px_1fr] items-center gap-3">
                <span className="text-xs font-medium text-slate-700">Imagen</span>
                <input type="file" accept="image/*" onChange={handleImage} className="block w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700" />
              </div>
            </aside>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row">
            <Button type="submit" loading={saving} icon={Save} aria-label={editingId ? "Guardar cambios" : "Guardar item"} title={editingId ? "Guardar cambios" : "Guardar item"} className="h-10 w-10 px-0" />
            {editingId && (
              <Button type="button" variant="outline" icon={X} aria-label="Cancelar" title="Cancelar" onClick={cancelEdit} className="h-10 w-10 px-0" />
            )}
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
