import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarCheck, CreditCard, FileBarChart, Layers3, Users, WalletCards } from "lucide-react";
import AlertMessage from "../components/AlertMessage";
import PageHeader from "../components/PageHeader";
import PageLoader from "../components/PageLoader";
import SummaryCard from "../components/SummaryCard";
import Card from "../components/Card";
import { getHrSummary } from "../services/hrService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";

const modules = [
  { title: "Empleados", path: "/recursos-humanos/empleados", icon: Users },
  { title: "Departamentos", path: "/recursos-humanos/departamentos", icon: Layers3 },
  { title: "Puestos", path: "/recursos-humanos/puestos", icon: BriefcaseBusiness },
  { title: "Asistencia", path: "/recursos-humanos/asistencia", icon: CalendarCheck },
  { title: "Nomina", path: "/recursos-humanos/nomina", icon: WalletCards },
  { title: "Pagos", path: "/recursos-humanos/pagos", icon: CreditCard },
  { title: "Reportes", path: "/recursos-humanos/reportes", icon: FileBarChart }
];

export default function HumanResources() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getHrSummary().then(setSummary).catch((err) => setError(getErrorMessage(err, "No fue posible cargar RRHH"))).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Cargando Recursos Humanos..." />;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Gestion interna" title="Recursos Humanos" description="Empleados, asistencia, nomina simple y pagos a empleados." />
      <AlertMessage>{error}</AlertMessage>
      {summary && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="Empleados" value={summary.totalEmployees} helper={`${summary.activeEmployees} activos`} icon={Users} tone="accent" />
          <SummaryCard title="Inactivos" value={summary.inactiveEmployees} icon={Users} tone="amber" />
          <SummaryCard title="Nomina estimada" value={money.format(summary.monthlyPayrollEstimate)} icon={WalletCards} tone="blue" />
          <SummaryCard title="Pagado este mes" value={money.format(summary.paidThisMonth)} icon={CreditCard} tone="green" />
          <SummaryCard title="Asistencia hoy" value={`${summary.attendanceToday.present}/${summary.attendanceToday.absent}/${summary.attendanceToday.late}`} helper="Presentes / ausentes / tarde" icon={CalendarCheck} tone="violet" />
        </section>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map(({ title, path, icon: Icon }) => (
          <Link key={path} to={path}>
            <Card interactive className="flex min-h-28 items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-accent dark:bg-teal-950/40 dark:text-teal-300"><Icon size={22} /></span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-slate-100">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Abrir modulo</p>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
