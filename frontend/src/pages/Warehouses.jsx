import { Edit2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { createWarehouse, getWarehouses, updateWarehouse, updateWarehouseStatus } from "../services/warehouseService";
import { getErrorMessage } from "../utils/errors";

const emptyWarehouse = { code: "", name: "", address: "" };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(emptyWarehouse);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setWarehouses(await getWarehouses());
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
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Inventario</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Almacenes</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-[140px_1fr_1fr_auto_auto] dark:border-slate-800 dark:bg-slate-900">
        <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Codigo" className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950" />
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre" className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950" />
        <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Direccion" className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950" />
        <Button type="submit" icon={Save}>{editingId ? "Guardar" : "Crear"}</Button>
        {editingId && <Button type="button" variant="outline" icon={X} onClick={() => { setEditingId(null); setForm(emptyWarehouse); }}>Cancelar</Button>}
      </form>
      {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando almacenes...</div> : <DataTable columns={columns} rows={warehouses} minWidth="760px" emptyTitle="Sin almacenes" />}
    </div>
  );
}
