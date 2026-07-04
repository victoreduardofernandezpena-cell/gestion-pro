import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import DataTable from "../../components/DataTable";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { getPayrolls } from "../../services/hrService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money } from "../../utils/format";

export default function Payroll() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { getPayrolls().then(setRows).catch((err) => setError(getErrorMessage(err, "No fue posible cargar nominas"))); }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Nomina" eyebrow="Recursos Humanos" description="Nominas simples generadas para empleados."><Link to="/recursos-humanos/nomina/nueva"><Button icon={Plus}>Nueva nomina</Button></Link></PageHeader>
      <AlertMessage>{error}</AlertMessage>
      <DataTable rows={rows} minWidth="980px" columns={[
        { key: "payrollNumber", header: "Numero", className: "font-semibold" },
        { key: "period", header: "Periodo", render: (r) => `${formatDate(r.startDate)} - ${formatDate(r.endDate)}` },
        { key: "paymentDate", header: "Pago", render: (r) => formatDate(r.paymentDate) },
        { key: "totalGross", header: "Bruto", render: (r) => money.format(Number(r.totalGross)) },
        { key: "totalDeductions", header: "Deducciones", render: (r) => money.format(Number(r.totalDeductions)) },
        { key: "totalNet", header: "Neto", render: (r) => money.format(Number(r.totalNet)) },
        { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
        { key: "actions", header: "Acciones", align: "right", render: (r) => <Button size="sm" variant="outline" icon={Eye} onClick={() => navigate(`/recursos-humanos/nomina/${r.id}`)}>Ver</Button> }
      ]} />
    </div>
  );
}
