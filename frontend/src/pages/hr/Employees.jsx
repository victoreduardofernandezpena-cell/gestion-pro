import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { createEmployee, getDepartments, getEmployees, getPositions, updateEmployee } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { money } from "../../utils/format";

const empty = { firstName: "", lastName: "", documentId: "", phone: "", email: "", address: "", birthDate: "", hireDate: new Date().toISOString().slice(0, 10), positionId: "", departmentId: "", salary: 0, paymentFrequency: "MONTHLY", status: "ACTIVE", notes: "" };

export default function Employees() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "", departmentId: "", positionId: "" });
  const [error, setError] = useState("");

  const load = () => getEmployees(filters).then(setRows).catch((err) => setError(getErrorMessage(err, "No fue posible cargar empleados")));
  useEffect(() => { Promise.all([getDepartments(), getPositions()]).then(([d, p]) => { setDepartments(d); setPositions(p); }); }, []);
  useEffect(() => { load(); }, [filters]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      editing ? await updateEmployee(editing.id, form) : await createEmployee(form);
      toast.success(editing ? "Empleado actualizado" : "Empleado creado");
      setEditing(null); setForm(empty); load();
    } catch (err) { setError(getErrorMessage(err, "No fue posible guardar empleado")); }
  };

  const startEdit = (row) => {
    setEditing(row);
    setForm({ ...empty, ...row, birthDate: row.birthDate?.slice(0, 10) || "", hireDate: row.hireDate?.slice(0, 10) || "", terminationDate: row.terminationDate?.slice(0, 10) || "", positionId: row.positionId || "", departmentId: row.departmentId || "", salary: Number(row.salary) });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Empleados" eyebrow="Recursos Humanos" description="Registro de empleados, salarios y estado laboral." />
      <AlertMessage>{error}</AlertMessage>
      <Card className="grid gap-3 lg:grid-cols-4">
        <input placeholder="Buscar empleado" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Todos los estados</option><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option><option value="TERMINATED">Terminado</option></select>
        <select value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Departamentos</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select value={filters.positionId} onChange={(e) => setFilters({ ...filters, positionId: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Puestos</option>{positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </Card>
      <section className="grid gap-6 2xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">{editing ? "Editar empleado" : "Nuevo empleado"}</h2>
          <form onSubmit={submit} className="grid gap-x-3 sm:grid-cols-2">
            <FormField label="Nombre" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
            <FormField label="Apellido" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
            <FormField label="Documento" value={form.documentId || ""} onChange={(v) => setForm({ ...form, documentId: v })} />
            <FormField label="Telefono" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
            <FormField label="Email" type="email" value={form.email || ""} onChange={(v) => setForm({ ...form, email: v })} />
            <FormField label="Ingreso" type="date" value={form.hireDate} onChange={(v) => setForm({ ...form, hireDate: v })} required />
            <FormField label="Departamento" as="select" value={form.departmentId || ""} onChange={(v) => setForm({ ...form, departmentId: v })}><option value="">Sin departamento</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</FormField>
            <FormField label="Puesto" as="select" value={form.positionId || ""} onChange={(v) => setForm({ ...form, positionId: v })}><option value="">Sin puesto</option>{positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</FormField>
            <FormField label="Salario mensual" type="number" min={0} value={form.salary} onChange={(v) => setForm({ ...form, salary: v })} required />
            <FormField label="Frecuencia" as="select" value={form.paymentFrequency} onChange={(v) => setForm({ ...form, paymentFrequency: v })}><option value="MONTHLY">Mensual</option><option value="BIWEEKLY">Quincenal</option><option value="WEEKLY">Semanal</option></FormField>
            <FormField label="Estado" as="select" value={form.status} onChange={(v) => setForm({ ...form, status: v })}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option><option value="TERMINATED">Terminado</option></FormField>
            <FormField label="Direccion" value={form.address || ""} onChange={(v) => setForm({ ...form, address: v })} />
            <div className="sm:col-span-2"><FormField label="Notas" as="textarea" value={form.notes || ""} onChange={(v) => setForm({ ...form, notes: v })} /></div>
            <Button type="submit" className="sm:col-span-2">{editing ? "Guardar" : "Crear empleado"}</Button>
            {editing && <Button variant="ghost" className="sm:col-span-2" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</Button>}
          </form>
        </Card>
        <DataTable rows={rows} minWidth="1100px" columns={[
          { key: "name", header: "Nombre", render: (r) => `${r.firstName} ${r.lastName}` },
          { key: "documentId", header: "Documento" },
          { key: "phone", header: "Telefono" },
          { key: "email", header: "Email" },
          { key: "position", header: "Puesto", render: (r) => r.position?.name || "-" },
          { key: "department", header: "Departamento", render: (r) => r.department?.name || "-" },
          { key: "salary", header: "Salario", render: (r) => money.format(Number(r.salary)) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
          { key: "actions", header: "Acciones", align: "right", render: (r) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" icon={Eye} onClick={() => navigate(`/recursos-humanos/empleados/${r.id}`)}>Ver</Button><Button size="sm" variant="ghost" onClick={() => startEdit(r)}>Editar</Button></div> }
        ]} />
      </section>
    </div>
  );
}
