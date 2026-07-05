import { Edit2, RotateCcw, Save, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout } from "../components/FormLayout";
import { createBrand, getBrands, updateBrand, updateBrandStatus } from "../services/brandService";
import { getErrorMessage } from "../utils/errors";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (query = search) => {
    setLoading(true);
    try {
      setBrands(await getBrands(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar marcas"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await updateBrand(editingId, form);
      else await createBrand(form);
      setForm({ name: "" });
      setEditingId(null);
      toast.success("Marca guardada");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar la marca"));
    }
  };

  const columns = [
    { key: "name", header: "Marca", className: "font-semibold" },
    { key: "isActive", header: "Estado", render: (row) => row.isActive ? "Activa" : "Inactiva" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" icon={Edit2} onClick={() => { setEditingId(row.id); setForm({ name: row.name }); }} />
          <Button variant="outline" size="sm" onClick={async () => { await updateBrandStatus(row.id, !row.isActive); await load(); }}>{row.isActive ? "Inactivar" : "Activar"}</Button>
        </div>
      )
    }
  ];

  return (
    <FormPageLayout
      eyebrow="Inventario"
      title="Marcas"
      subtitle="Organiza productos por marcas para busqueda, reportes y control comercial."
      actions={(
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
            <Search size={18} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(event.currentTarget.value)} placeholder="Buscar marca" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-56" />
          </div>
          <Button type="button" variant="outline" icon={Search} onClick={() => load(search)}>Buscar</Button>
        </div>
      )}
    >
      <AlertMessage>{error}</AlertMessage>
      <FormCard title={editingId ? "Editar marca" : "Nueva marca"} description="Mantén nombres consistentes para que productos y reportes sean faciles de filtrar.">
        <form onSubmit={submit} className="space-y-5">
          <FormGrid columns="xl:grid-cols-2">
            <FormField label="Nombre de marca" value={form.name} onChange={(value) => setForm({ name: value })} required />
          </FormGrid>
          <ActionBar>
            <Button type="submit" icon={Save}>{editingId ? "Guardar cambios" : "Crear marca"}</Button>
            <Button type="button" variant="outline" icon={RotateCcw} onClick={() => { setEditingId(null); setForm({ name: "" }); }}>Limpiar</Button>
            {editingId && <Button type="button" variant="danger" icon={X} onClick={() => { setEditingId(null); setForm({ name: "" }); }}>Cancelar</Button>}
          </ActionBar>
        </form>
      </FormCard>
      <FormCard title="Listado de marcas" description="Activa o inactiva marcas sin afectar el historial de productos.">
        <DataTable columns={columns} rows={brands} loading={loading} minWidth="680px" emptyTitle="Sin marcas" />
      </FormCard>
    </FormPageLayout>
  );
}
