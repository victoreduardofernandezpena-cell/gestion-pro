import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { getAttendanceReport, getEmployeesReport, getPayrollReport } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money } from "../../utils/format";

export default function HRReports() {
  const [payroll, setPayroll] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getPayrollReport(), getAttendanceReport(), getEmployeesReport()])
      .then(([p, a, e]) => { setPayroll(p); setAttendance(a); setEmployees(e); })
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar reportes")));
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Reportes HR" eyebrow="Recursos Humanos" description="Resumen de nomina, asistencia y empleados." />
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Total nomina neta</p><p className="mt-2 text-xl font-semibold">{money.format(payroll?.totalNet || 0)}</p></Card>
        <Card><p className="text-sm text-slate-500">Total pagado</p><p className="mt-2 text-xl font-semibold">{money.format(payroll?.totalPaid || 0)}</p></Card>
        <Card><p className="text-sm text-slate-500">Empleados activos</p><p className="mt-2 text-xl font-semibold">{employees?.active || 0}</p></Card>
        <Card><p className="text-sm text-slate-500">Asistencias</p><p className="mt-2 text-xl font-semibold">{attendance?.records?.length || 0}</p></Card>
      </section>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Reporte de nomina</h2>
        <DataTable rows={payroll?.payrolls || []} minWidth="900px" columns={[
          { key: "payrollNumber", header: "Numero" },
          { key: "paymentDate", header: "Pago", render: (r) => formatDate(r.paymentDate) },
          { key: "totalGross", header: "Bruto", render: (r) => money.format(Number(r.totalGross)) },
          { key: "totalDeductions", header: "Deducciones", render: (r) => money.format(Number(r.totalDeductions)) },
          { key: "totalNet", header: "Neto", render: (r) => money.format(Number(r.totalNet)) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }
        ]} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Reporte de asistencia</h2>
        <DataTable rows={attendance?.records || []} minWidth="900px" columns={[
          { key: "employee", header: "Empleado", render: (r) => `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}` },
          { key: "date", header: "Fecha", render: (r) => formatDate(r.date) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
          { key: "hoursWorked", header: "Horas", render: (r) => Number(r.hoursWorked || 0).toFixed(2) }
        ]} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Reporte de empleados</h2>
        <DataTable rows={employees?.employees || []} minWidth="900px" columns={[
          { key: "name", header: "Nombre", render: (r) => `${r.firstName} ${r.lastName}` },
          { key: "department", header: "Departamento", render: (r) => r.department?.name || "-" },
          { key: "position", header: "Puesto", render: (r) => r.position?.name || "-" },
          { key: "salary", header: "Salario", render: (r) => money.format(Number(r.salary)) },
          { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }
        ]} />
      </Card>
    </div>
  );
}
