import { Camera, Edit2, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout, FormSection, ModernCheckbox } from "../components/FormLayout";
import { getErrorMessage } from "../utils/errors";
import { getBrands } from "../services/brandService";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/productService";
import { getCategories } from "../services/settingsService";
import { DEFAULT_PAGINATION, normalizePaginatedResult } from "../utils/pagination";
import { useAuth } from "../context/AuthContext";
import { money } from "../utils/format";

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

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [imagePreview, setImagePreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const canManageProducts = ["admin", "almacen"].includes(user?.role);

  const loadProducts = async (query = search, page = pagination.page) => {
    setLoading(true);
    try {
      const result = await getProducts(query, { page, limit: pagination.limit });
      const normalized = normalizePaginatedResult(result, { ...pagination, page });
      setProducts(normalized.rows);
      setPagination(normalized.meta);
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
      resetForm();
      await loadProducts(search, pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar el producto"));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(emptyProduct);
    setImagePreview("");
    setEditingId(null);
  };

  const edit = (product) => {
    setEditingId(product.id);
    setForm({
      ...emptyProduct,
      ...product,
      brandId: product.brandId || "",
      cost: Number(product.cost || 0),
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      minimumStock: Number(product.minimumStock || 0)
    });
    setImagePreview("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar producto?")) return;
    try {
      await deleteProduct(id);
      await loadProducts(search, pagination.page);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar el producto"));
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBrand = (value) => {
    const brand = brands.find((item) => String(item.id) === String(value));
    setForm((current) => ({ ...current, brandId: value, brand: brand?.name || "" }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((current) => ({ ...current, imageName: "" }));
      setImagePreview("");
      return;
    }
    setForm((current) => ({ ...current, imageName: file.name }));
    setImagePreview(URL.createObjectURL(file));
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "reference", header: "Referencia", render: (product) => product.reference || "-" },
    { key: "brand", header: "Marca", render: (product) => product.brandRef?.name || product.brand || "-" },
    { key: "stock", header: "Stock" },
    { key: "cost", header: "Costo", render: (product) => money.format(Number(product.cost || 0)) },
    { key: "price", header: "Precio", render: (product) => money.format(Number(product.price || 0)) },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (product) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(product)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => remove(product.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40" aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      )
    }
  ].filter((column) => column.key !== "actions" || canManageProducts);

  return (
    <FormPageLayout
      eyebrow="Catalogo"
      title="Productos"
      subtitle="Crea y administra los productos del inventario con codificacion, categorizacion y reglas de control."
      actions={(
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
            <Search size={18} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadProducts(event.currentTarget.value, 1)} placeholder="Buscar nombre, codigo, SKU" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-64" />
          </div>
          <Button type="button" variant="outline" icon={Search} onClick={() => loadProducts(search, 1)}>Buscar</Button>
          <Button type="button" variant="ghost" icon={RotateCcw} onClick={() => { setSearch(""); loadProducts("", 1); }}>Limpiar</Button>
        </div>
      )}
    >
      <AlertMessage>{error}</AlertMessage>

      {canManageProducts && <form onSubmit={submit} className="space-y-6">
        <FormCard
          title={editingId ? "Editar producto" : "Crear producto"}
          description="Completa la informacion principal. Los campos marcados con asterisco son obligatorios."
          actions={editingId && <Button type="button" variant="outline" icon={X} onClick={resetForm}>Cancelar edicion</Button>}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-7">
              <FormSection title="Informacion general" description="Datos visibles para ventas, inventario y reportes.">
                <FormGrid columns="xl:grid-cols-4">
                  <FormField label="Nombre" value={form.name} onChange={(value) => updateField("name", value)} required className="sm:col-span-2" />
                  <FormField label="Precio" type="number" min={0} value={form.price} onChange={(value) => updateField("price", value)} required />
                  <FormField label="Estatus" as="select" value={form.status} onChange={(value) => updateField("status", value)}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </FormField>
                  <FormField label="Descripcion" as="textarea" value={form.description} onChange={(value) => updateField("description", value)} className="sm:col-span-2 xl:col-span-3" />
                  <FormField label="Tipo de item" as="select" value={form.itemType} onChange={(value) => updateField("itemType", value)} required>
                    <option value="">Seleccionar</option>
                    {productTypes.map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Codificacion" description="Identificadores para busqueda rapida, importaciones y lectura en caja.">
                <FormGrid columns="xl:grid-cols-4">
                  <FormField label="Codigo de barra" value={form.barcode} onChange={(value) => updateField("barcode", value)} />
                  <FormField label="Referencia" value={form.reference} onChange={(value) => updateField("reference", value)} />
                  <FormField label="SKU" value={form.sku} onChange={(value) => updateField("sku", value)} />
                  <FormField label="Codigo" value={form.code} onChange={(value) => updateField("code", value)} required />
                </FormGrid>
              </FormSection>

              <FormSection title="Categorizacion" description="Organiza el catalogo para busquedas, reportes y filtros.">
                <FormGrid columns="xl:grid-cols-5">
                  <FormField label="Categoria" as="select" value={form.category} onChange={(value) => updateField("category", value)}>
                    <option value="">Seleccionar</option>
                    <option value="PRODUCTO">Producto</option>
                    <option value="SERVICIO">Servicio</option>
                    <option value="REPUESTO">Repuesto</option>
                  </FormField>
                  <FormField label="Subcategoria" as="select" value={form.subcategory} onChange={(value) => updateField("subcategory", value)}>
                    <option value="">Seleccionar</option>
                    <option value="General">General</option>
                    <option value="Motor">Motor</option>
                    <option value="Accesorio">Accesorio</option>
                  </FormField>
                  <FormField label="Familia" as="select" value={form.family} onChange={(value) => updateField("family", value)}>
                    <option value="">Seleccionar</option>
                    <option value="Principal">Principal</option>
                    <option value="Secundaria">Secundaria</option>
                  </FormField>
                  <FormField label="Marca" as="select" value={form.brandId || ""} onChange={handleBrand}>
                    <option value="">Seleccionar</option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </FormField>
                  <FormField label="Unidad del item" as="select" value={form.unit} onChange={(value) => updateField("unit", value)}>
                    <option value="">Seleccionar</option>
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                  </FormField>
                </FormGrid>
              </FormSection>

              <FormSection title="Inventario" description="Valores base para control de existencia y alertas.">
                <FormGrid columns="xl:grid-cols-3">
                  <FormField label="Costo" type="number" min={0} value={form.cost} onChange={(value) => updateField("cost", value)} required />
                  <FormField label="Stock inicial" type="number" min={0} value={form.stock} onChange={(value) => updateField("stock", value)} />
                  <FormField label="Stock minimo" type="number" min={0} value={form.minimumStock} onChange={(value) => updateField("minimumStock", value)} />
                </FormGrid>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <ModernCheckbox label="Compuesto" description="Producto armado a partir de otros items." checked={form.isComposite} onChange={(value) => updateField("isComposite", value)} />
                  <ModernCheckbox label="Requiere lote" description="Solicitar lote en movimientos." checked={form.requiresLot} onChange={(value) => updateField("requiresLot", value)} />
                  <ModernCheckbox label="Requiere serie" description="Solicitar serie individual." checked={form.requiresSerial} onChange={(value) => updateField("requiresSerial", value)} />
                  <ModernCheckbox label="Tiene vencimiento" description="Controlar fecha de expiracion." checked={form.requiresExpiration} onChange={(value) => updateField("requiresExpiration", value)} />
                </div>
              </FormSection>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Imagen</p>
              <div className="mt-3 grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : (
                  <div>
                    <Camera size={46} className="mx-auto mb-2 text-slate-400" />
                    Imagen no disponible
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="mt-4 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200" />
              {form.imageName && <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">{form.imageName}</p>}
            </aside>
          </div>

          <ActionBar className="justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" loading={saving} icon={Save}>{editingId ? "Guardar cambios" : "Guardar producto"}</Button>
              <Button type="button" variant="outline" icon={RotateCcw} onClick={resetForm}>Limpiar</Button>
            </div>
            {editingId && <Button type="button" variant="danger" icon={X} onClick={resetForm}>Cancelar</Button>}
          </ActionBar>
        </FormCard>
      </form>}

      <FormCard title="Listado de productos" description={canManageProducts ? "Consulta, edita o elimina productos del catalogo." : "Consulta productos, precios y existencia disponible."}>
        <DataTable columns={columns} rows={products} loading={loading} pagination={pagination} onPageChange={(page) => loadProducts(search, page)} minWidth="980px" emptyTitle="No hay productos" emptyDescription="Crea un producto o ajusta la busqueda." />
      </FormCard>
    </FormPageLayout>
  );
}
