import { useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { createSupplier, deleteSupplier, searchSuppliers, updateSupplier } from "../services/supplierService";
import { getErrorMessage } from "../utils/errors";

const emptySupplier = { name: "", rnc: "", phone: "", email: "", address: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptySupplier);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSuppliers = async (query = search) => {
    setLoading(true);
    try {
      setSuppliers(await searchSuppliers(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar proveedores"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers("");
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await updateSupplier(editingId, form);
      else await createSupplier(form);
      setForm(emptySupplier);
      setEditingId(null);
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar el proveedor"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      rnc: supplier.rnc || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || ""
    });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar proveedor?")) return;
    try {
      await deleteSupplier(id);
      await loadSuppliers();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar el proveedor"));
    }
  };

  const columns = [
    { key: "name", header: "Proveedor", className: "font-medium" },
    { key: "rnc", header: "RNC" },
    { key: "phone", header: "Telefono" },
    { key: "email", header: "Email" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (supplier) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(supplier)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => remove(supplier.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Compras</p>
          <h1 className="text-3xl font-semibold text-slate-950">Proveedores</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && loadSuppliers(event.currentTarget.value)}
            placeholder="Nombre, RNC o telefono"
            className="w-64 outline-none"
          />
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar proveedor" : "Nuevo Proveedor"}</h2>
          {[
            ["name", "Nombre"],
            ["rnc", "RNC"],
            ["phone", "Telefono"],
            ["email", "Email"],
            ["address", "Direccion"]
          ].map(([field, label]) => (
            <FormField key={field} label={label} value={form[field]} onChange={(value) => setForm({ ...form, [field]: value })} required={field === "name"} />
          ))}
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptySupplier); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-soft">Cargando proveedores...</div>
        ) : (
          <DataTable columns={columns} rows={suppliers} emptyTitle="No hay proveedores" emptyDescription="Crea un proveedor o ajusta la busqueda." />
        )}
      </section>
    </div>
  );
}
