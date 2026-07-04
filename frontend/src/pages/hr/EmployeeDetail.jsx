import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { changeEmployeeStatus, createEmployeePayment, getEmployee } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, paymentMethodLabels } from "../../utils/format";

const paymentEmpty = { amount: "", method: "CASH", reference: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" };

export default function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [payment, setPayment] = useState(paymentEmpty);
  const [status, setStatus] = useState("ACTIVE");
  const [error, setError] = useState("");

  const load = () => getEmployee(id).then((data) => { setEmployee(data); setStatus(data.status); }).catch((err) => setError(getErrorMessage(err, "No fue posible cargar empleado")));
  useEffect(() => { load(); }, [id]);

  const submitPayment = async (event) => {
    event.preventDefault();
    try {
      await createEmployeePayment({ ...payment, amount: Number(payment.amount), employeeId: Number(id) });
      toast.success("Pago registrado");
      setPayment(paymentEmpty); load();
    } catch (err) { setError(getErrorMessage(err, "No fue posible registrar pago")); }
  };

  const updateStatus = async () => {
    try { await changeEmployeeStatus(id, { status }); toast.success("Estado actualizado"); load(); } catch (err) { setError(getErrorMessage(err, "No fue posible cambiar estado")); }
  };

  if (!employee) return <Card>Cargando empleado...</Card>;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Empleado" title={`${employee.firstName} ${employee.lastName}`} description={`${employee.position?.name || "Sin puesto"} | ${employee.department?.name || "Sin departamento"}`}>
        <Link className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700" to="/recursos-humanos/empleados">Volver</Link>
      </PageHeader>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Estado</p><div className="mt-2"><StatusBadge status={employee.status} /></div></Card>
        <Card><p className="text-sm text-slate-500">Documento</p><p className="mt-2 font-semibold">{employee.documentId || "-"}</p></Card>
        <Card><p className="text-sm text-slate-500">Salario</p><p className="mt-2 font-semibold">{money.format(Number(employee.salary))}</p></Card>
        <Card><p className="text-sm text-slate-500">Ingreso</p><p className="mt-2 font-semibold">{formatDate(employee.hireDate)}</p></Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Datos personales</h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-slate-500">Telefono:</span> {employee.phone || "-"}</p>
            <p><span className="text-slate-500">Email:</span> {employee.email || "-"}</p>
            <p><span className="text-slate-500">Direccion:</span> {employee.address || "-"}</p>
            <p><span className="text-slate-500">Frecuencia:</span> {employee.paymentFrequency}</p>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Cambiar estado</h2>
          <FormField label="Estado" as="select" value={status} onChange={setStatus}><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option><option value="SUSPENDED">Suspendido</option><option value="TERMINATED">Terminado</option></FormField>
          <Button className="w-full" onClick={updateStatus}>Actualizar estado</Button>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Historial de pagos</h2>
          <DataTable rows={employee.payments || []} minWidth="760px" columns={[
            { key: "paymentDate", header: "Fecha", render: (r) => formatDate(r.paymentDate) },
            { key: "amount", header: "Monto", render: (r) => money.format(Number(r.amount)) },
            { key: "method", header: "Metodo", render: (r) => paymentMethodLabels[r.method] || r.method },
            { key: "reference", header: "Referencia" },
            { key: "payroll", header: "Nomina", render: (r) => r.payroll?.payrollNumber || "-" }
          ]} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Registrar pago</h2>
          <form onSubmit={submitPayment}>
            <FormField label="Monto" type="number" min={0} value={payment.amount} onChange={(v) => setPayment({ ...payment, amount: v })} required />
            <FormField label="Metodo" as="select" value={payment.method} onChange={(v) => setPayment({ ...payment, method: v })}>{Object.entries(paymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
            <FormField label="Referencia" value={payment.reference} onChange={(v) => setPayment({ ...payment, reference: v })} />
            <FormField label="Fecha" type="date" value={payment.paymentDate} onChange={(v) => setPayment({ ...payment, paymentDate: v })} required />
            <FormField label="Notas" as="textarea" value={payment.notes} onChange={(v) => setPayment({ ...payment, notes: v })} />
            <Button type="submit" className="w-full">Registrar pago</Button>
          </form>
        </Card>
      </section>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Asistencia reciente</h2>
        <DataTable rows={employee.attendanceRecords || []} columns={[
          { key: "date", header: "Fecha", render: (r) => formatDate(r.date) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
          { key: "hoursWorked", header: "Horas", render: (r) => Number(r.hoursWorked || 0).toFixed(2) },
          { key: "notes", header: "Notas" }
        ]} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Nominas relacionadas</h2>
        <DataTable rows={employee.payrollItems || []} columns={[
          { key: "payroll", header: "Nomina", render: (r) => r.payroll?.payrollNumber },
          { key: "grossSalary", header: "Bruto", render: (r) => money.format(Number(r.grossSalary)) },
          { key: "deductions", header: "Deducciones", render: (r) => money.format(Number(r.deductions)) },
          { key: "bonuses", header: "Bonos", render: (r) => money.format(Number(r.bonuses)) },
          { key: "netSalary", header: "Neto", render: (r) => money.format(Number(r.netSalary)) }
        ]} />
      </Card>
    </div>
  );
}
