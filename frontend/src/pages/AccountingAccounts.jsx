import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import {
  accountTypeLabels,
  createAccountingAccount,
  deleteAccountingAccount,
  getAccountingAccounts,
  updateAccountingAccount
} from "../services/accountingService";
import { getErrorMessage } from "../utils/errors";

const emptyAccount = { code: "", name: "", type: "ASSET" };

export default function AccountingAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyAccount);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = async (query = search) => {
    setLoading(true);
    try {
      setAccounts(await getAccountingAccounts(query));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar cuentas contables"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts("");
  }, []);

  const canEditCode = useMemo(() => {
    if (!editingId) return true;
    const account = accounts.find((item) => item.id === editingId);
    return !account || account._count?.lines === 0;
  }, [accounts, editingId]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.code.trim()) return setError("El codigo es obligatorio");
    if (!form.name.trim()) return setError("El nombre es obligatorio");

    setSaving(true);
    try {
      if (editingId) await updateAccountingAccount(editingId, form);
      else await createAccountingAccount(form);
      setForm(emptyAccount);
      setEditingId(null);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar la cuenta"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (account) => {
    setEditingId(account.id);
    setForm({ code: account.code, name: account.name, type: account.type });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar o desactivar esta cuenta contable?")) return;
    try {
      await deleteAccountingAccount(id);
      await loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar la cuenta"));
    }
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Nombre" },
    { key: "type", header: "Tipo", render: (account) => accountTypeLabels[account.type] },
    {
      key: "isActive",
      header: "Estado",
      render: (account) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${account.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {account.isActive ? "Activa" : "Inactiva"}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (account) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => edit(account)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar cuenta"><Edit2 size={16} /></button>
          <button onClick={() => remove(account.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar cuenta"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contabilidad</p>
          <h1 className="text-3xl font-semibold text-slate-950">Catalogo de Cuentas</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadAccounts(event.currentTarget.value)} placeholder="Codigo o nombre" className="w-64 outline-none" />
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar cuenta" : "Crear cuenta"}</h2>
          <FormField label="Codigo" value={form.code} onChange={(value) => setForm({ ...form, code: value })} required />
          {!canEditCode && <p className="-mt-2 mb-3 text-xs text-slate-500">No se puede cambiar el codigo porque la cuenta tiene movimientos.</p>}
          <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
          <FormField label="Tipo" as="select" value={form.type} onChange={(value) => setForm({ ...form, type: value })} required>
            {Object.entries(accountTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FormField>
          <div className="flex gap-2">
            <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyAccount); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}
          </div>
        </form>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuentas contables...</div>
        ) : (
          <DataTable columns={columns} rows={accounts} minWidth="860px" emptyTitle="No hay cuentas contables" emptyDescription="Crea una cuenta o ajusta la busqueda." />
        )}
      </section>
    </div>
  );
}
