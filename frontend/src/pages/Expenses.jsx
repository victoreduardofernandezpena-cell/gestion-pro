import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { getBankAccounts } from "../services/bankService";
import { getCashBoxes } from "../services/cashBoxService";
import { createExpense, getExpenses, getExpenseSummary } from "../services/expenseService";
import { getErrorMessage } from "../utils/errors";
import { expenseCategoryLabels, expensePaymentSourceLabels, formatDate, money } from "../utils/format";

const emptyExpense = {
  category: "OTHER",
  description: "",
  amount: "",
  paymentSource: "OTHER",
  bankAccountId: "",
  cashBoxId: "",
  reference: "",
  expenseDate: new Date().toISOString().slice(0, 10)
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [form, setForm] = useState(emptyExpense);
  const [filters, setFilters] = useState({ category: "", paymentSource: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [expenseData, summaryData, bankData, cashData] = await Promise.all([
        getExpenses(nextFilters),
        getExpenseSummary(),
        getBankAccounts(),
        getCashBoxes()
      ]);
      setExpenses(expenseData);
      setSummary(summaryData);
      setBankAccounts(bankData.filter((account) => account.isActive));
      setCashBoxes(cashData.filter((box) => box.isActive));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar gastos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedBank = useMemo(() => bankAccounts.find((account) => String(account.id) === String(form.bankAccountId)), [bankAccounts, form.bankAccountId]);
  const selectedCashBox = useMemo(() => cashBoxes.find((box) => String(box.id) === String(form.cashBoxId)), [cashBoxes, form.cashBoxId]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!form.description.trim()) return setError("La descripcion es obligatoria");
    if (Number.isNaN(amount) || amount <= 0) return setError("El monto debe ser mayor que cero");
    if (form.paymentSource === "BANK" && !form.bankAccountId) return setError("Debe seleccionar una cuenta bancaria");
    if (form.paymentSource === "BANK" && selectedBank && amount > Number(selectedBank.currentBalance)) return setError("El gasto no puede ser mayor al balance del banco");
    if (form.paymentSource === "CASH_BOX" && !form.cashBoxId) return setError("Debe seleccionar una caja chica");
    if (form.paymentSource === "CASH_BOX" && selectedCashBox && amount > Number(selectedCashBox.currentBalance)) return setError("El gasto no puede ser mayor al balance de caja chica");

    setSaving(true);
    try {
      await createExpense({ ...form, amount });
      setForm(emptyExpense);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible crear el gasto"));
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  };

  const columns = [
    { key: "expenseDate", header: "Fecha", render: (row) => formatDate(row.expenseDate) },
    { key: "category", header: "Categoria", render: (row) => expenseCategoryLabels[row.category] },
    { key: "description", header: "Descripcion", className: "font-medium" },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "paymentSource", header: "Fuente", render: (row) => expensePaymentSourceLabels[row.paymentSource] },
    { key: "reference", header: "Referencia" }
  ];

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Gastos</p><h1 className="text-3xl font-semibold text-slate-950">Gastos operativos</h1></div>
      <AlertMessage>{error}</AlertMessage>
      {summary && <section className="grid gap-4 md:grid-cols-2"><SummaryCard title="Total gastos" value={money.format(Number(summary.totalExpenses || 0))} tone="red" /><SummaryCard title="Cantidad de gastos" value={summary.countExpenses || 0} tone="blue" /></section>}
      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Plus size={18} />Nuevo gasto</h2>
          <FormField label="Categoria" as="select" value={form.category} onChange={(value) => setForm({ ...form, category: value })}>{Object.entries(expenseCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
          <FormField label="Descripcion" value={form.description} onChange={(value) => setForm({ ...form, description: value })} required />
          <FormField label="Monto" type="number" min={0} value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} required />
          <FormField label="Fuente de pago" as="select" value={form.paymentSource} onChange={(value) => setForm({ ...form, paymentSource: value })}>{Object.entries(expensePaymentSourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
          {form.paymentSource === "BANK" && <FormField label="Cuenta bancaria" as="select" value={form.bankAccountId} onChange={(value) => setForm({ ...form, bankAccountId: value })}>{<option value="">Seleccionar</option>}{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {money.format(Number(account.currentBalance))}</option>)}</FormField>}
          {form.paymentSource === "CASH_BOX" && <FormField label="Caja chica" as="select" value={form.cashBoxId} onChange={(value) => setForm({ ...form, cashBoxId: value })}>{<option value="">Seleccionar</option>}{cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name} - {money.format(Number(box.currentBalance))}</option>)}</FormField>}
          <FormField label="Referencia" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
          <FormField label="Fecha" type="date" value={form.expenseDate} onChange={(value) => setForm({ ...form, expenseDate: value })} required />
          <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar gasto"}</button>
        </form>
        <div className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-3">
            <select value={filters.category} onChange={(event) => applyFilters({ category: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"><option value="">Todas las categorias</option>{Object.entries(expenseCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={filters.paymentSource} onChange={(event) => applyFilters({ paymentSource: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent"><option value="">Todas las fuentes</option>{Object.entries(expensePaymentSourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <input type="date" value={filters.date} onChange={(event) => applyFilters({ date: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
          </div>
          {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando gastos...</div> : <DataTable columns={columns} rows={expenses} minWidth="860px" emptyTitle="No hay gastos" emptyDescription="Registra un gasto o ajusta los filtros." />}
        </div>
      </section>
    </div>
  );
}
