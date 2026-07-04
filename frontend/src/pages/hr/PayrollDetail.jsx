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
import { approvePayroll, cancelPayroll, getPayroll, payPayroll } from "../../services/hrService";
import { getBankAccounts } from "../../services/bankService";
import { getCashBoxes } from "../../services/cashBoxService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money, paymentMethodLabels } from "../../utils/format";

export default function PayrollDetail() {
  const { id } = useParams();
  const [payroll, setPayroll] = useState(null);
  const [pay, setPay] = useState({ method: "BANK_TRANSFER", bankAccountId: "", cashBoxId: "", reference: "", paymentDate: new Date().toISOString().slice(0, 10), notes: "" });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashBoxes, setCashBoxes] = useState([]);
  const [error, setError] = useState("");
  const load = () => getPayroll(id).then(setPayroll).catch((err) => setError(getErrorMessage(err, "No fue posible cargar nomina")));
  useEffect(() => {
    load();
    getBankAccounts().then(setBankAccounts).catch(() => setBankAccounts([]));
    getCashBoxes().then(setCashBoxes).catch(() => setCashBoxes([]));
  }, [id]);
  const action = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch (err) { setError(getErrorMessage(err, "No fue posible completar accion")); } };
  const submitPayment = () => {
    if (pay.method === "BANK_TRANSFER" && !pay.bankAccountId) return setError("Selecciona la cuenta bancaria que realizara el pago");
    if (pay.method === "CASH" && !pay.cashBoxId) return setError("Selecciona la caja que realizara el pago");
    return action(() => payPayroll(id, pay), "Nomina pagada");
  };
  if (!payroll) return <Card>Cargando nomina...</Card>;
  return (
    <div className="space-y-6">
      <PageHeader title={payroll.payrollNumber} eyebrow="Nomina" description={`${formatDate(payroll.startDate)} - ${formatDate(payroll.endDate)}`}>
        <Link to="/recursos-humanos/nomina" className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Volver</Link>
        {payroll.status === "DRAFT" && <Button onClick={() => action(() => approvePayroll(id), "Nomina aprobada")}>Aprobar</Button>}
        {["DRAFT", "APPROVED"].includes(payroll.status) && <Button variant="danger" onClick={() => action(() => cancelPayroll(id), "Nomina cancelada")}>Cancelar</Button>}
      </PageHeader>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-slate-500">Estado</p><div className="mt-2"><StatusBadge status={payroll.status} /></div></Card>
        <Card><p className="text-sm text-slate-500">Total bruto</p><p className="mt-2 font-semibold">{money.format(Number(payroll.totalGross))}</p></Card>
        <Card><p className="text-sm text-slate-500">Deducciones</p><p className="mt-2 font-semibold">{money.format(Number(payroll.totalDeductions))}</p></Card>
        <Card><p className="text-sm text-slate-500">Total neto</p><p className="mt-2 font-semibold">{money.format(Number(payroll.totalNet))}</p></Card>
      </section>
      {payroll.status === "APPROVED" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Pagar nomina</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <FormField label="Metodo" as="select" value={pay.method} onChange={(v) => setPay({ ...pay, method: v, bankAccountId: "", cashBoxId: "" })}>{Object.entries(paymentMethodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</FormField>
            {pay.method === "BANK_TRANSFER" && <FormField label="Cuenta bancaria" as="select" value={pay.bankAccountId} onChange={(v) => setPay({ ...pay, bankAccountId: v })}><option value="">Selecciona una cuenta</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} - {money.format(Number(account.currentBalance))}</option>)}</FormField>}
            {pay.method === "CASH" && <FormField label="Caja" as="select" value={pay.cashBoxId} onChange={(v) => setPay({ ...pay, cashBoxId: v })}><option value="">Selecciona una caja</option>{cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name} - {money.format(Number(box.currentBalance))}</option>)}</FormField>}
            <FormField label="Referencia" value={pay.reference} onChange={(v) => setPay({ ...pay, reference: v })} />
            <FormField label="Fecha" type="date" value={pay.paymentDate} onChange={(v) => setPay({ ...pay, paymentDate: v })} />
            <div className="flex items-end"><Button className="w-full" onClick={submitPayment}>Pagar</Button></div>
          </div>
        </Card>
      )}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Empleados</h2>
        <DataTable rows={payroll.items || []} minWidth="900px" columns={[
          { key: "employee", header: "Empleado", render: (r) => `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}` },
          { key: "grossSalary", header: "Bruto", render: (r) => money.format(Number(r.grossSalary)) },
          { key: "bonuses", header: "Bonos", render: (r) => money.format(Number(r.bonuses)) },
          { key: "deductions", header: "Deducciones", render: (r) => money.format(Number(r.deductions)) },
          { key: "netSalary", header: "Neto", render: (r) => money.format(Number(r.netSalary)) },
          { key: "notes", header: "Notas" }
        ]} />
      </Card>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Pagos generados</h2>
        <DataTable rows={payroll.payments || []} columns={[
          { key: "employee", header: "Empleado", render: (r) => `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}` },
          { key: "amount", header: "Monto", render: (r) => money.format(Number(r.amount)) },
          { key: "method", header: "Metodo", render: (r) => paymentMethodLabels[r.method] || r.method },
          { key: "paymentDate", header: "Fecha", render: (r) => formatDate(r.paymentDate) },
          { key: "reference", header: "Referencia" }
        ]} />
      </Card>
    </div>
  );
}
