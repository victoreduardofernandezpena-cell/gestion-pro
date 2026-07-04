import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { createAttendance, getAttendance, getEmployees, updateAttendance } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";

const empty = { employeeId: "", date: new Date().toISOString().slice(0, 10), checkIn: "", checkOut: "", status: "PRESENT", notes: "" };

export default function Attendance() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ date: "", employeeId: "", status: "" });
  const [error, setError] = useState("");
  const load = () => getAttendance(filters).then(setRows).catch((err) => setError(getErrorMessage(err, "No fue posible cargar asistencia")));
  useEffect(() => { getEmployees({ status: "ACTIVE" }).then(setEmployees); }, []);
  useEffect(() => { load(); }, [filters]);
  const submit = async (event) => {
    event.preventDefault();
    try { editing ? await updateAttendance(editing.id, form) : await createAttendance(form); toast.success("Asistencia guardada"); setEditing(null); setForm(empty); load(); } catch (err) { setError(getErrorMessage(err, "No fue posible guardar asistencia")); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Asistencia" eyebrow="Recursos Humanos" description="Registro basico de asistencia diaria." />
      <AlertMessage>{error}</AlertMessage>
      <Card className="grid gap-3 lg:grid-cols-3">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Todos</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Estados</option><option value="PRESENT">Presente</option><option value="ABSENT">Ausente</option><option value="LATE">Tarde</option><option value="HALF_DAY">Medio dia</option><option value="VACATION">Vacaciones</option><option value="SICK">Enfermo</option><option value="PERMISSION">Permiso</option></select>
      </Card>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{editing ? "Editar asistencia" : "Registrar asistencia"}</h2>
          <form onSubmit={submit}>
            <FormField label="Empleado" as="select" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} required><option value="">Seleccionar</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</FormField>
            <FormField label="Fecha" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} required />
            <FormField label="Entrada" type="datetime-local" value={form.checkIn || ""} onChange={(v) => setForm({ ...form, checkIn: v })} />
            <FormField label="Salida" type="datetime-local" value={form.checkOut || ""} onChange={(v) => setForm({ ...form, checkOut: v })} />
            <FormField label="Estado" as="select" value={form.status} onChange={(v) => setForm({ ...form, status: v })}><option value="PRESENT">Presente</option><option value="ABSENT">Ausente</option><option value="LATE">Tarde</option><option value="HALF_DAY">Medio dia</option><option value="VACATION">Vacaciones</option><option value="SICK">Enfermo</option><option value="PERMISSION">Permiso</option></FormField>
            <FormField label="Notas" as="textarea" value={form.notes || ""} onChange={(v) => setForm({ ...form, notes: v })} />
            <Button type="submit" className="w-full">Guardar</Button>
          </form>
        </Card>
        <DataTable rows={rows} minWidth="920px" columns={[
          { key: "employee", header: "Empleado", render: (r) => `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}` },
          { key: "date", header: "Fecha", render: (r) => formatDate(r.date) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
          { key: "hoursWorked", header: "Horas", render: (r) => Number(r.hoursWorked || 0).toFixed(2) },
          { key: "notes", header: "Notas" },
          { key: "actions", header: "Acciones", align: "right", render: (r) => <Button size="sm" variant="outline" onClick={() => { setEditing(r); setForm({ employeeId: r.employeeId, date: r.date?.slice(0, 10), checkIn: r.checkIn?.slice(0, 16) || "", checkOut: r.checkOut?.slice(0, 16) || "", status: r.status, notes: r.notes || "" }); }}>Editar</Button> }
        ]} />
      </section>
    </div>
  );
}
