import { Edit2, RotateCcw, Save, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout } from "../components/FormLayout";
import { createWarehouse, getWarehouses, updateWarehouse, updateWarehouseStatus } from "../services/warehouseService";
import { getErrorMessage } from "../utils/errors";

const emptyWarehouse = { code: "", name: "", address: "" };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(emptyWarehouse);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (query = search) => {
    setLoading(true);
    try {
      setWarehouses(await getWarehouses(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar almacenes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) await updateWarehouse(editingId, form);
      else await createWarehouse(form);
      setForm(emptyWarehouse);
      setEditingId(null);
      toast.success("Almacen guardado");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar el almacen"));
    }
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-semibold" },
    { key: "name", header: "Almacen" },
    { key: "address", header: "Direccion", render: (row) => row.address || "-" },
    { key: "isActive", header: "Estado", render: (row) => row.isActive ? "Activo" : "Inactivo" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" icon={Edit2} onClick={() => { setEditingId(row.id); setForm({ code: row.code, name: row.name, address: row.address || "" }); }} />
          <Button variant="outline" size="sm" onClick={async () => { await updateWarehouseStatus(row.id, !row.isActive); await load(); }}>{row.isActive ? "Inactivar" : "Activar"}</Button>
        </div>
      )
    }
  ];

  return (
    <FormPageLayout
      eyebrow="Inventario"
      title="Almacenes"
      subtitle="Administra las ubicaciones donde entran y salen productos del negocio."
      actions={(
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
            <Search size={18} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(event.currentTarget.value)} placeholder="Buscar almacen" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-56" />
          </div>
          <Button type="button" variant="outline" icon={Search} onClick={() => load(search)}>Buscar</Button>
        </div>
      )}
    >
      <AlertMessage>{error}</AlertMessage>
      <FormCard title={editingId ? "Editar almacen" : "Nuevo almacen"} description="Usa codigos cortos y claros para seleccionar almacenes en movimientos.">
        <form onSubmit={submit} className="space-y-5">
          <FormGrid columns="xl:grid-cols-3">
            <FormField label="Codigo" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
            <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormField label="Direccion" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          </FormGrid>
          <ActionBar>
            <Button type="submit" icon={Save}>{editingId ? "Guardar cambios" : "Crear almacen"}</Button>
            <Button type="button" variant="outline" icon={RotateCcw} onClick={() => { setEditingId(null); setForm(emptyWarehouse); }}>Limpiar</Button>
            {editingId && <Button type="button" variant="danger" icon={X} onClick={() => { setEditingId(null); setForm(emptyWarehouse); }}>Cancelar</Button>}
          </ActionBar>
        </form>
      </FormCard>
      <FormCard title="Listado de almacenes" description="Activa o inactiva ubicaciones sin borrar historial de movimientos.">
        <DataTable columns={columns} rows={warehouses} loading={loading} minWidth="760px" emptyTitle="Sin almacenes" />
      </FormCard>
    </FormPageLayout>
  );
}
