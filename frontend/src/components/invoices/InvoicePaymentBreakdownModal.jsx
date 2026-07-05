import { CreditCard, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../Button";
import { ActionBar } from "../FormLayout";
import { money } from "../../utils/format";

export default function InvoicePaymentBreakdownModal({ invoice, bankAccounts = [], cashBoxes = [], onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [payments, setPayments] = useState([{ method: "CASH", amount: "", reference: "", paymentDate: today, cashBoxId: "", bankAccountId: "" }]);

  useEffect(() => {
    if (invoice) {
      setPayments([{ method: "CASH", amount: Number(invoice.balance || 0), reference: "", paymentDate: today, cashBoxId: cashBoxes[0]?.id || "", bankAccountId: "" }]);
    }
  }, [invoice, cashBoxes]);

  if (!invoice) return null;

  const totalFactura = Number(invoice.total || 0);
  const totalCobrado = Number(invoice.paidAmount || 0);
  const falta = Number(invoice.balance || 0);
  const totalRecibido = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const devuelta = Math.max(totalRecibido - falta, 0);

  const updatePayment = (index, field, value) => {
    setPayments((current) => current.map((payment, currentIndex) => currentIndex === index ? { ...payment, [field]: value } : payment));
  };

  const addPayment = () => {
    setPayments((current) => [...current, { method: "CASH", amount: "", reference: "", paymentDate: today, cashBoxId: cashBoxes[0]?.id || "", bankAccountId: "" }]);
  };

  const removePayment = (index) => {
    setPayments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave(payments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount || 0),
      reference: payment.reference,
      paymentDate: payment.paymentDate,
      cashBoxId: payment.method === "CASH" ? payment.cashBoxId : null,
      bankAccountId: payment.method === "BANK_TRANSFER" ? payment.bankAccountId : null
    })));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Pago multiple</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{invoice.invoiceNumber}</h2>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <PaymentMetric label="Total factura" value={totalFactura} />
          <PaymentMetric label="Total cobrado" value={totalCobrado} />
          <PaymentMetric label="Falta por cobrar" value={falta} />
          <PaymentMetric label="Devuelta" value={devuelta} />
        </div>
        <div className="mt-5 space-y-3">
          {payments.map((payment, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[140px_120px_1fr_150px_150px_auto] dark:border-slate-700">
              <select value={payment.method} onChange={(event) => updatePayment(index, "method", event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="CASH">Efectivo</option>
                <option value="BANK_TRANSFER">Transferencia</option>
                <option value="CARD">Tarjeta</option>
                <option value="CHECK">Cheque/deposito</option>
                <option value="OTHER">Otro</option>
              </select>
              <input type="number" min={0.01} step="0.01" value={payment.amount} onChange={(event) => updatePayment(index, "amount", event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <input value={payment.reference} onChange={(event) => updatePayment(index, "reference", event.target.value)} placeholder="Referencia" className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              {payment.method === "CASH" ? (
                <select value={payment.cashBoxId} onChange={(event) => updatePayment(index, "cashBoxId", event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Caja</option>
                  {cashBoxes.map((box) => <option key={box.id} value={box.id}>{box.name}</option>)}
                </select>
              ) : payment.method === "BANK_TRANSFER" ? (
                <select value={payment.bankAccountId} onChange={(event) => updatePayment(index, "bankAccountId", event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option value="">Banco</option>
                  {bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              ) : <span className="hidden md:block" />}
              <input type="date" value={payment.paymentDate} onChange={(event) => updatePayment(index, "paymentDate", event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
              <button type="button" onClick={() => removePayment(index)} className="grid h-11 w-11 place-items-center rounded-xl border border-rose-200 text-rose-600" aria-label="Eliminar pago"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <ActionBar className="justify-between">
          <Button type="button" variant="outline" icon={Plus} onClick={addPayment}>Agregar pago</Button>
          <Button type="submit" icon={CreditCard}>Registrar pagos</Button>
        </ActionBar>
      </form>
    </div>
  );
}

function PaymentMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">{money.format(Number(value || 0))}</p>
    </div>
  );
}
