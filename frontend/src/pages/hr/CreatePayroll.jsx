import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import { createPayroll, getEmployees } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { money } from "../../utils/format";

const today = new Date().toISOString().slice(0, 10);

export default function CreatePayroll() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ startDate: today, endDate: today, paymentDate: today, notes: "" });
  const [error, setError] = useState("");
  useEffect(() => { getEmployees({ status: "ACTIVE" }).then((rows) => { setEmployees(rows); setSelected(rows.map((row) => row.id)); }); }, []);
  const preview = useMemo(() => employees.filter((e) => selected.includes(e.id)).map((e) => {
    const salary = Number(e.salary || 0);
    const gross = e.paymentFrequency === "WEEKLY" ? salary / 4 : e.paymentFrequency === "BIWEEKLY" ? salary / 2 : salary;
    return { ...e, gross, net: gross };
  }), [employees, selected]);
  const submit = async () => {
    try {
      const payroll = await createPayroll({ ...form, employeeIds: selected });
      toast.success("Nomina creada");
      navigate(`/recursos-humanos/nomina/${payroll.id}`);
    } catch (err) { setError(getErrorMessage(err, "No fue posible crear nomina")); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Nueva nomina" eyebrow="Recursos Humanos" description="Genera una nomina DRAFT para empleados activos." />
      <AlertMessage>{error}</AlertMessage>
      <Card className="grid gap-4 md:grid-cols-4">
        <FormField label="Inicio" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} required />
        <FormField label="Fin" type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} required />
        <FormField label="Fecha de pago" type="date" value={form.paymentDate} onChange={(v) => setForm({ ...form, paymentDate: v })} required />
        <div className="flex items-end"><Button className="w-full" onClick={submit}>Guardar DRAFT</Button></div>
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Empleados incluidos</h2>
        <DataTable rows={preview} columns={[
          { key: "select", header: "", render: (r) => <input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id))} /> },
          { key: "name", header: "Empleado", render: (r) => `${r.firstName} ${r.lastName}` },
          { key: "position", header: "Puesto", render: (r) => r.position?.name || "-" },
          { key: "salary", header: "Salario mensual", render: (r) => money.format(Number(r.salary)) },
          { key: "paymentFrequency", header: "Frecuencia" },
          { key: "gross", header: "Bruto", render: (r) => money.format(r.gross) },
          { key: "net", header: "Neto", render: (r) => money.format(r.net) }
        ]} />
      </Card>
    </div>
  );
}
