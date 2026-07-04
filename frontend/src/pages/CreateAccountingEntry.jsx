import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import FormField from "../components/FormField";
import { accountTypeLabels, createAccountingEntry, getAccountingAccounts } from "../services/accountingService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const emptyLine = { accountId: "", debit: "", credit: "", description: "" };

const numberValue = (value) => {
  const number = Number(value || 0);
  return Number.isNaN(number) ? 0 : number;
};

export default function CreateAccountingEntry() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [entry, setEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    reference: "",
    lines: [{ ...emptyLine }, { ...emptyLine }]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccountingAccounts()
      .then((data) => {
        setAccounts(data.filter((account) => account.isActive));
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar cuentas contables")))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const totalDebit = entry.lines.reduce((sum, line) => sum + numberValue(line.debit), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + numberValue(line.credit), 0);
    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit
    };
  }, [entry.lines]);

  const updateLine = (index, field, value) => {
    setEntry((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => (
        lineIndex === index ? { ...line, [field]: value } : line
      ))
    }));
  };

  const addLine = () => setEntry({ ...entry, lines: [...entry.lines, { ...emptyLine }] });

  const removeLine = (index) => {
    if (entry.lines.length <= 2) return setError("El asiento debe tener al menos 2 lineas");
    setEntry({ ...entry, lines: entry.lines.filter((_, lineIndex) => lineIndex !== index) });
  };

  const validate = () => {
    if (!entry.date) return "La fecha es obligatoria";
    if (!entry.description.trim()) return "La descripcion es obligatoria";
    if (entry.lines.length < 2) return "El asiento debe tener al menos 2 lineas";

    for (const line of entry.lines) {
      const debit = numberValue(line.debit);
      const credit = numberValue(line.credit);
      if (!line.accountId) return "Cada linea debe tener una cuenta";
      if (debit < 0 || credit < 0) return "Debito y credito no pueden ser negativos";
      if (debit > 0 && credit > 0) return "Una linea no puede tener debito y credito al mismo tiempo";
      if (debit === 0 && credit === 0) return "Cada linea debe tener debito o credito";
    }

    if (Math.round(totals.difference * 100) !== 0) return "El asiento no esta cuadrado";
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) return setError(validationError);

    setSaving(true);
    try {
      const created = await createAccountingEntry({
        ...entry,
        lines: entry.lines.map((line) => ({
          accountId: Number(line.accountId),
          debit: numberValue(line.debit),
          credit: numberValue(line.credit),
          description: line.description
        }))
      });
      navigate(`/contabilidad/asientos/${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible guardar el asiento"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuentas contables...</div>;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contabilidad</p>
        <h1 className="text-3xl font-semibold text-slate-950">Nuevo Asiento</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Fecha" type="date" value={entry.date} onChange={(value) => setEntry({ ...entry, date: value })} required />
          <FormField label="Descripcion" value={entry.description} onChange={(value) => setEntry({ ...entry, description: value })} required />
          <FormField label="Referencia" value={entry.reference} onChange={(value) => setEntry({ ...entry, reference: value })} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Lineas del asiento</h2>
          <button type="button" onClick={addLine} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700">
            <Plus size={16} />
            Agregar linea
          </button>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-3">Cuenta</th>
                <th className="px-3 py-3">Descripcion</th>
                <th className="px-3 py-3">Debito</th>
                <th className="px-3 py-3">Credito</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entry.lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-3 py-3">
                    <select value={line.accountId} onChange={(event) => updateLine(index, "accountId", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" required>
                      <option value="">Selecciona cuenta</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name} ({accountTypeLabels[account.type]})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input value={line.description} onChange={(event) => updateLine(index, "description", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min="0" value={line.debit} onChange={(event) => updateLine(index, "debit", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
                  </td>
                  <td className="px-3 py-3">
                    <input type="number" min="0" value={line.credit} onChange={(event) => updateLine(index, "credit", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" onClick={() => removeLine(index)} className="rounded-lg border border-rose-200 p-2 text-rose-600" aria-label="Eliminar linea">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><p className="text-sm text-slate-500">Total debito</p><p className="text-xl font-semibold">{money.format(totals.totalDebit)}</p></div>
          <div><p className="text-sm text-slate-500">Total credito</p><p className="text-xl font-semibold">{money.format(totals.totalCredit)}</p></div>
          <div><p className="text-sm text-slate-500">Diferencia</p><p className={`text-xl font-semibold ${Math.abs(totals.difference) < 0.01 ? "text-emerald-700" : "text-rose-700"}`}>{money.format(totals.difference)}</p></div>
        </div>
        <button disabled={saving || Math.round(totals.difference * 100) !== 0} className="rounded-lg bg-accent px-5 py-2 font-semibold text-white disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar asiento"}
        </button>
      </section>
    </form>
  );
}
