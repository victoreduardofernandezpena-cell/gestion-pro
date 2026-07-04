import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import { createEmployeePayment, getEmployeePayments, getEmployees } from "../../services/hrService";
import { getBankAccounts } from "../../services/bankService";
import { getCashBoxes } from "../../services/cashBoxService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, paymentMethodLabels } from "../../utils/format";

const empty = { employeeId: "", amount: "", method: "CASH", bankAccountId: "", cashBoxId: "", reference: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" };

export default function EmployeePayments() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const load = () => getEmployeePayments().then(setRows).catch((err) => setError(getErrorMessage(err, "No fue posible cargar pagos")));
  useEffect(() => {
    load();
    getEmployees({ status: "ACTIVE" }).then(setEmployees);
    getBankAccounts().then(setBankAccounts).catch(() => setBankAccounts([]));
    getCashBoxes().then(setCashBoxes).catch(() => setCashBoxes([]));
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount),
      bankAccountId: form.method === "BANK_TRANSFER" ? form.bankAccountId || undefined : undefined,
      cashBoxId: form.method === "CASH" ? form.cashBoxId || undefined : undefined
    };
    if (form.method === "BANK_TRANSFER" && !form.bankAccountId) return setError("Selecciona la cuenta bancaria que realizara el pago");
    if (form.method === "CASH" && !form.cashBoxId) return setError("Selecciona la caja que realizara el pago");
    try { await createEmployeePayment(payload); toast.success("Pago registrado"); setForm(empty); load(); } catch (err) { setError(getErrorMessage(err, "No fue posible registrar pago")); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Pagos a empleados" eyebrow="Recursos Humanos" description="Pagos individuales y pagos generados por nomina." />
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Registrar pago</h2>
          <form onSubmit={submit}>
            <FormField label="Empleado" as="select" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} required><option value="">Seleccionar</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</FormField>
            <FormField label="Monto" type="number" min={0} value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required />
            <FormField label="Metodo" as="select" value={form.method} onChange={(v) => setForm({ ...form, method: v, bankAccountId: "", cashBoxId: "" })}>{Object.entries(paymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
            {form.method === "BANK_TRANSFER" && <FormField label="Cuenta bancaria" as="select" value={form.bankAccountId} onChange={(v) => setForm({ ...form, bankAccountId: v })}><option value="">Selecciona una cuenta</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {money.format(Number(account.currentBalance))}</option>)}</FormField>}
            {form.method === "CASH" && <FormField label="Caja" as="select" value={form.cashBoxId} onChange={(v) => setForm({ ...form, cashBoxId: v })}><option value="">Selecciona una caja</option>{cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name} - {money.format(Number(box.currentBalance))}</option>)}</FormField>}
            <FormField label="Referencia" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
            <FormField label="Fecha" type="date" value={form.paymentDate} onChange={(v) => setForm({ ...form, paymentDate: v })} required />
            <FormField label="Notas" as="textarea" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            <Button type="submit" className="w-full">Registrar</Button>
          </form>
        </Card>
        <DataTable rows={rows} minWidth="900px" columns={[
          { key: "employee", header: "Empleado", render: (r) => `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}` },
          { key: "amount", header: "Monto", render: (r) => money.format(Number(r.amount)) },
          { key: "method", header: "Metodo", render: (r) => paymentMethodLabels[r.method] || r.method },
          { key: "reference", header: "Referencia" },
          { key: "paymentDate", header: "Fecha", render: (r) => formatDate(r.paymentDate) },
          { key: "payroll", header: "Nomina", render: (r) => r.payroll?.payrollNumber || "-" },
          { key: "notes", header: "Notas" }
        ]} />
      </section>
    </div>
  );
}
