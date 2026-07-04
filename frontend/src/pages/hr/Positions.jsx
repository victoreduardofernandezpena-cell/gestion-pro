import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { changePositionStatus, createPosition, getPositions, updatePosition } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { money } from "../../utils/format";

const empty = { name: "", description: "", baseSalary: 0 };

export default function Positions() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const load = () => getPositions().then(setRows).catch((err) => setError(getErrorMessage(err, "No fue posible cargar puestos")));
  useEffect(() => { load(); }, []);
  const submit = async (event) => {
    event.preventDefault();
    try {
      editing ? await updatePosition(editing.id, form) : await createPosition(form);
      toast.success(editing ? "Puesto actualizado" : "Puesto creado");
      setForm(empty); setEditing(null); load();
    } catch (err) { setError(getErrorMessage(err, "No fue posible guardar")); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Puestos" eyebrow="Recursos Humanos" description="Roles y salarios base." />
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">{editing ? "Editar puesto" : "Nuevo puesto"}</h2>
          <form onSubmit={submit}>
            <FormField label="Nombre" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <FormField label="Salario base" type="number" min={0} value={form.baseSalary} onChange={(value) => setForm({ ...form, baseSalary: value })} />
            <FormField label="Descripcion" as="textarea" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <Button type="submit" className="w-full">{editing ? "Guardar" : "Crear"}</Button>
            {editing && <Button variant="ghost" className="mt-2 w-full" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</Button>}
          </form>
        </Card>
        <DataTable rows={rows} columns={[
          { key: "name", header: "Nombre", className: "font-semibold" },
          { key: "baseSalary", header: "Salario base", render: (row) => money.format(Number(row.baseSalary)) },
          { key: "employees", header: "Empleados", render: (row) => row._count?.employees || 0 },
          { key: "isActive", header: "Estado", render: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} /> },
          { key: "actions", header: "Acciones", align: "right", render: (row) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ name: row.name, description: row.description || "", baseSalary: Number(row.baseSalary) }); }}>Editar</Button><Button size="sm" variant="ghost" onClick={async () => { await changePositionStatus(row.id, !row.isActive); load(); }}>{row.isActive ? "Desactivar" : "Activar"}</Button></div> }
        ]} />
      </section>
    </div>
  );
}
