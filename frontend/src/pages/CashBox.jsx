import { useEffect, useMemo, useState } from "react";
import { Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { createCashBox, deleteCashBox, getCashBoxes, updateCashBox } from "../services/cashBoxService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const emptyCashBox = { name: "", description: "", initialBalance: 0 };

export default function CashBox() {
  const navigate = useNavigate();
  const [cashBoxes, setCashBoxes] = useState([]);
  const [form, setForm] = useState(emptyCashBox);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try { setCashBoxes(await getCashBoxes()); setError(""); } catch (err) { setError(getErrorMessage(err, "No fue posible cargar cajas chicas")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalCash = useMemo(() => cashBoxes.filter((box) => box.isActive).reduce((sum, box) => sum + Number(box.currentBalance), 0), [cashBoxes]);
  const activeCount = cashBoxes.filter((box) => box.isActive).length;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await updateCashBox(editingId, { ...form, isActive: true });
      else await createCashBox(form);
      setForm(emptyCashBox);
      setEditingId(null);
      await load();
    } catch (err) { setError(getErrorMessage(err, "No fue posible guardar la caja chica")); } finally { setSaving(false); }
  };

  const edit = (box) => { setEditingId(box.id); setForm({ name: box.name, description: box.description || "", initialBalance: box.initialBalance }); };
  const remove = async (id) => {
    if (!confirm("Eliminar o desactivar esta caja chica?")) return;
    try { await deleteCashBox(id); await load(); } catch (err) { setError(getErrorMessage(err, "No fue posible eliminar o desactivar la caja")); }
  };

  const columns = [
    { key: "name", header: "Nombre", className: "font-medium" },
    { key: "description", header: "Descripcion" },
    { key: "currentBalance", header: "Balance", render: (row) => money.format(Number(row.currentBalance)) },
    { key: "isActive", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.isActive ? "Activa" : "Inactiva"}</span> },
    { key: "actions", header: "Acciones", align: "right", render: (row) => <div className="flex justify-end gap-2"><button onClick={() => navigate(`/caja-chica/${row.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Ver"><Eye size={16} /></button><button onClick={() => edit(row)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button><button onClick={() => remove(row.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar"><Trash2 size={16} /></button></div> }
  ];

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Tesoreria</p><h1 className="text-3xl font-semibold text-slate-950">Caja Chica</h1></div>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 md:grid-cols-2"><SummaryCard title="Total en caja chica" value={money.format(totalCash)} tone="accent" /><SummaryCard title="Cajas activas" value={activeCount} tone="green" /></section>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar caja" : "Nueva caja chica"}</h2>
          <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <FormField label="Descripcion" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          {!editingId && <FormField label="Balance inicial" type="number" min={0} value={form.initialBalance} onChange={(value) => setForm({ ...form, initialBalance: value })} />}
          <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyCashBox); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}</div>
        </form>
        {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cajas chicas...</div> : <DataTable columns={columns} rows={cashBoxes} minWidth="820px" emptyTitle="No hay cajas chicas" emptyDescription="Crea una caja chica para registrar movimientos." />}
      </section>
    </div>
  );
}
