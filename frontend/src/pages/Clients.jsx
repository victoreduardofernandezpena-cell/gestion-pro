import { useEffect, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { createClient, deleteClient, getClients, updateClient } from "../services/clientService";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getErrorMessage } from "../utils/errors";

const emptyClient = { name: "", rnc: "", phone: "", email: "", address: "" };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyClient);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadClients = async (query = search) => {
    setLoading(true);
    try {
      setClients(await getClients(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar clientes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients("");
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await updateClient(editingId, form);
      else await createClient(form);
      setForm(emptyClient);
      setEditingId(null);
      await loadClients();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar el cliente"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (client) => {
    setEditingId(client.id);
    setForm({ name: client.name || "", rnc: client.rnc || "", phone: client.phone || "", email: client.email || "", address: client.address || "" });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar cliente?")) return;
    try {
      await deleteClient(id);
      await loadClients();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar el cliente"));
    }
  };

  const columns = [
    { key: "name", header: "Nombre", className: "font-medium" },
    { key: "rnc", header: "RNC" },
    { key: "phone", header: "Telefono" },
    { key: "email", header: "Email" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (client) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(client)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => remove(client.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">CRM</p>
          <h1 className="text-3xl font-semibold text-slate-950">Clientes</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && loadClients(event.currentTarget.value)}
            placeholder="Nombre, RNC o telefono"
            className="w-64 outline-none"
          />
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar cliente" : "Crear cliente"}</h2>
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
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyClient); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-soft">Cargando clientes...</div>
        ) : (
          <DataTable columns={columns} rows={clients} emptyTitle="No hay clientes" emptyDescription="Crea un cliente o ajusta la busqueda." />
        )}
      </section>
    </div>
  );
}
