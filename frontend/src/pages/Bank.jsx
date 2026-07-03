import { useEffect, useMemo, useState } from "react";
import { Edit2, Eye, Plus, Repeat, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { createBankAccount, deleteBankAccount, getBankAccounts, transferBank, updateBankAccount } from "../services/bankService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const emptyAccount = { name: "", bankName: "", accountNumber: "", currency: "DOP", initialBalance: 0 };
const emptyTransfer = { fromBankAccountId: "", toBankAccountId: "", amount: "", description: "", reference: "", transactionDate: new Date().toISOString().slice(0, 10) };

export default function Bank() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyAccount);
  const [transfer, setTransfer] = useState(emptyTransfer);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBankAccounts();
      setAccounts(data);
      setError("");
      if (data[0] && !transfer.fromBankAccountId) setTransfer((current) => ({ ...current, fromBankAccountId: data[0].id, toBankAccountId: data[1]?.id || data[0].id }));
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar cuentas bancarias"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalBank = useMemo(() => accounts.filter((a) => a.isActive).reduce((sum, account) => sum + Number(account.currentBalance), 0), [accounts]);
  const activeCount = accounts.filter((a) => a.isActive).length;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingId) await updateBankAccount(editingId, { ...form, isActive: true });
      else await createBankAccount(form);
      setForm(emptyAccount);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar la cuenta bancaria"));
    } finally {
      setSaving(false);
    }
  };

  const edit = (account) => {
    setEditingId(account.id);
    setForm({ name: account.name, bankName: account.bankName, accountNumber: account.accountNumber || "", currency: account.currency, initialBalance: account.initialBalance });
  };

  const remove = async (id) => {
    if (!confirm("Eliminar o desactivar esta cuenta bancaria?")) return;
    try {
      await deleteBankAccount(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible eliminar o desactivar la cuenta"));
    }
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    setError("");
    if (transfer.fromBankAccountId === transfer.toBankAccountId) return setError("No se puede transferir a la misma cuenta");
    if (Number(transfer.amount) <= 0) return setError("El monto debe ser mayor que cero");
    try {
      await transferBank({ ...transfer, amount: Number(transfer.amount) });
      setTransfer((current) => ({ ...emptyTransfer, fromBankAccountId: current.fromBankAccountId, toBankAccountId: current.toBankAccountId }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible realizar la transferencia"));
    }
  };

  const columns = [
    { key: "name", header: "Nombre", className: "font-medium" },
    { key: "bankName", header: "Banco" },
    { key: "accountNumber", header: "Numero" },
    { key: "currency", header: "Moneda" },
    { key: "currentBalance", header: "Balance", render: (row) => money.format(Number(row.currentBalance)) },
    { key: "isActive", header: "Estado", render: (row) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{row.isActive ? "Activa" : "Inactiva"}</span> },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate(`/banco/${row.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Ver"><Eye size={16} /></button>
          <button onClick={() => edit(row)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Editar"><Edit2 size={16} /></button>
          <button onClick={() => remove(row.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar"><Trash2 size={16} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Tesoreria</p><h1 className="text-3xl font-semibold text-slate-950">Banco</h1></div>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 md:grid-cols-2"><SummaryCard title="Total en bancos" value={money.format(totalBank)} tone="blue" /><SummaryCard title="Cuentas activas" value={activeCount} tone="green" /></section>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />{editingId ? "Editar cuenta" : "Nueva cuenta bancaria"}</h2>
            <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormField label="Banco" value={form.bankName} onChange={(value) => setForm({ ...form, bankName: value })} required />
            <FormField label="Numero de cuenta" value={form.accountNumber} onChange={(value) => setForm({ ...form, accountNumber: value })} />
            <FormField label="Moneda" value={form.currency} onChange={(value) => setForm({ ...form, currency: value })} />
            {!editingId && <FormField label="Balance inicial" type="number" min={0} value={form.initialBalance} onChange={(value) => setForm({ ...form, initialBalance: value })} />}
            <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyAccount); }} className="rounded-lg border border-slate-300 px-4 py-2">Cancelar</button>}</div>
          </form>
          <form onSubmit={submitTransfer} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Repeat size={18} />Transferencia</h2>
            <FormField label="Origen" as="select" value={transfer.fromBankAccountId} onChange={(value) => setTransfer({ ...transfer, fromBankAccountId: value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</FormField>
            <FormField label="Destino" as="select" value={transfer.toBankAccountId} onChange={(value) => setTransfer({ ...transfer, toBankAccountId: value })}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</FormField>
            <FormField label="Monto" type="number" min={0} value={transfer.amount} onChange={(value) => setTransfer({ ...transfer, amount: value })} required />
            <FormField label="Descripcion" value={transfer.description} onChange={(value) => setTransfer({ ...transfer, description: value })} />
            <FormField label="Referencia" value={transfer.reference} onChange={(value) => setTransfer({ ...transfer, reference: value })} />
            <FormField label="Fecha" type="date" value={transfer.transactionDate} onChange={(value) => setTransfer({ ...transfer, transactionDate: value })} required />
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Transferir</button>
          </form>
        </div>
        {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuentas bancarias...</div> : <DataTable columns={columns} rows={accounts} minWidth="980px" emptyTitle="No hay cuentas bancarias" emptyDescription="Crea una cuenta bancaria para registrar movimientos." />}
      </section>
    </div>
  );
}
