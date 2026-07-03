import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { adjustCashBox, cashIn, cashOut, getCashBox } from "../services/cashBoxService";
import { getErrorMessage } from "../utils/errors";
import { cashTransactionLabels, formatDate, money } from "../utils/format";

const baseMovement = { amount: "", description: "", reference: "", transactionDate: new Date().toISOString().slice(0, 10) };
const baseAdjustment = { newBalance: "", reason: "", reference: "", transactionDate: new Date().toISOString().slice(0, 10) };

export default function CashBoxDetail() {
  const { id } = useParams();
  const [cashBox, setCashBox] = useState(null);
  const [entry, setEntry] = useState(baseMovement);
  const [exit, setExit] = useState(baseMovement);
  const [adjustment, setAdjustment] = useState(baseAdjustment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try { setCashBox(await getCashBox(id)); setError(""); } catch (err) { setError(getErrorMessage(err, "No fue posible cargar la caja chica")); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const submitMovement = async (event, kind) => {
    event.preventDefault();
    const payload = kind === "in" ? entry : exit;
    if (Number(payload.amount) <= 0) return setError("El monto debe ser mayor que cero");
    try {
      if (kind === "in") { await cashIn(id, { ...payload, amount: Number(payload.amount) }); setEntry(baseMovement); }
      else { await cashOut(id, { ...payload, amount: Number(payload.amount) }); setExit(baseMovement); }
      await load();
    } catch (err) { setError(getErrorMessage(err, "No fue posible registrar el movimiento")); }
  };

  const submitAdjustment = async (event) => {
    event.preventDefault();
    if (Number(adjustment.newBalance) < 0 || !adjustment.reason.trim()) return setError("El ajuste requiere razon y balance no negativo");
    try { await adjustCashBox(id, { ...adjustment, newBalance: Number(adjustment.newBalance) }); setAdjustment(baseAdjustment); await load(); } catch (err) { setError(getErrorMessage(err, "No fue posible ajustar la caja")); }
  };

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando caja chica...</div>;
  if (!cashBox) return <AlertMessage>{error || "Caja chica no encontrada"}</AlertMessage>;

  const columns = [
    { key: "transactionDate", header: "Fecha", render: (row) => formatDate(row.transactionDate) },
    { key: "type", header: "Tipo", render: (row) => cashTransactionLabels[row.type] },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "description", header: "Descripcion" },
    { key: "reference", header: "Referencia" }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Caja Chica</p><h1 className="text-3xl font-semibold text-slate-950">{cashBox.name}</h1><p className="text-slate-500">{cashBox.description}</p></div><Link to="/caja-chica" className="h-10 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Volver</Link></div>
      <AlertMessage>{error}</AlertMessage>
      <SummaryCard title="Balance actual" value={money.format(Number(cashBox.currentBalance))} tone="accent" />
      <section className="grid gap-6 xl:grid-cols-3">
        <form onSubmit={(e) => submitMovement(e, "in")} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Entrada</h2><FormField label="Monto" type="number" min={0} value={entry.amount} onChange={(v) => setEntry({ ...entry, amount: v })} required /><FormField label="Descripcion" value={entry.description} onChange={(v) => setEntry({ ...entry, description: v })} /><FormField label="Referencia" value={entry.reference} onChange={(v) => setEntry({ ...entry, reference: v })} /><FormField label="Fecha" type="date" value={entry.transactionDate} onChange={(v) => setEntry({ ...entry, transactionDate: v })} required /><button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Registrar entrada</button></form>
        <form onSubmit={(e) => submitMovement(e, "out")} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Salida</h2><FormField label="Monto" type="number" min={0} value={exit.amount} onChange={(v) => setExit({ ...exit, amount: v })} required /><FormField label="Descripcion" value={exit.description} onChange={(v) => setExit({ ...exit, description: v })} /><FormField label="Referencia" value={exit.reference} onChange={(v) => setExit({ ...exit, reference: v })} /><FormField label="Fecha" type="date" value={exit.transactionDate} onChange={(v) => setExit({ ...exit, transactionDate: v })} required /><button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Registrar salida</button></form>
        <form onSubmit={submitAdjustment} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Ajuste</h2><FormField label="Nuevo balance" type="number" min={0} value={adjustment.newBalance} onChange={(v) => setAdjustment({ ...adjustment, newBalance: v })} required /><FormField label="Razon" value={adjustment.reason} onChange={(v) => setAdjustment({ ...adjustment, reason: v })} required /><FormField label="Referencia" value={adjustment.reference} onChange={(v) => setAdjustment({ ...adjustment, reference: v })} /><FormField label="Fecha" type="date" value={adjustment.transactionDate} onChange={(v) => setAdjustment({ ...adjustment, transactionDate: v })} required /><button className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white">Ajustar</button></form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><h2 className="mb-4 text-lg font-semibold">Historial de movimientos</h2><DataTable columns={columns} rows={cashBox.transactions} minWidth="760px" emptyTitle="Sin movimientos" /></section>
    </div>
  );
}
