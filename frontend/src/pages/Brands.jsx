import { Edit2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { createBrand, getBrands, updateBrand, updateBrandStatus } from "../services/brandService";
import { getErrorMessage } from "../utils/errors";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setBrands(await getBrands());
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
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Inventario</p>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Marcas</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <form onSubmit={submit} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:flex-row dark:border-slate-800 dark:bg-slate-900">
        <input value={form.name} onChange={(event) => setForm({ name: event.target.value })} placeholder="Nombre de marca" className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent dark:border-slate-700 dark:bg-slate-950" />
        <Button type="submit" icon={Save}>{editingId ? "Guardar" : "Crear"}</Button>
        {editingId && <Button type="button" variant="outline" icon={X} onClick={() => { setEditingId(null); setForm({ name: "" }); }}>Cancelar</Button>}
      </form>
      {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando marcas...</div> : <DataTable columns={columns} rows={brands} minWidth="680px" emptyTitle="Sin marcas" />}
    </div>
  );
}
