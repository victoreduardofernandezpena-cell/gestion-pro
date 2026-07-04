import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import {
  accountTypeLabels,
  cancelAccountingEntry,
  entryStatusLabels,
  getAccountingEntry,
  postAccountingEntry
} from "../services/accountingService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money } from "../utils/format";

const statusClass = {
  DRAFT: "bg-amber-50 text-amber-700",
  POSTED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700"
};

export default function AccountingEntryDetail() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEntry = async () => {
    setLoading(true);
    try {
      setEntry(await getAccountingEntry(id));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar el asiento"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntry();
  }, [id]);

  const post = async () => {
    setSaving(true);
    setError("");
    try {
      setEntry(await postAccountingEntry(entry.id));
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible publicar el asiento"));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancelar este asiento contable?")) return;
    setSaving(true);
    setError("");
    try {
      setEntry(await cancelAccountingEntry(entry.id));
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cancelar el asiento"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando asiento...</div>;
  if (!entry) return <AlertMessage>{error || "Asiento no encontrado"}</AlertMessage>;

  const columns = [
    { key: "account", header: "Cuenta", render: (line) => `${line.account?.code} - ${line.account?.name}` },
    { key: "type", header: "Tipo", render: (line) => accountTypeLabels[line.account?.type] },
    { key: "description", header: "Descripcion" },
    { key: "debit", header: "Debito", render: (line) => money.format(Number(line.debit || 0)) },
    { key: "credit", header: "Credito", render: (line) => money.format(Number(line.credit || 0)) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Asiento Contable</p>
          <h1 className="text-3xl font-semibold text-slate-950">{entry.entryNumber}</h1>
          <p className="mt-1 text-slate-500">{entry.description} | {formatDate(entry.date)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/contabilidad/asientos" className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700">Volver</Link>
          {entry.status === "DRAFT" && (
            <button type="button" onClick={post} disabled={saving} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">Publicar</button>
          )}
          {["DRAFT", "POSTED"].includes(entry.status) && (
            <button type="button" onClick={cancel} disabled={saving} className="rounded-lg border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700 disabled:opacity-60">Cancelar</button>
          )}
        </div>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-sm text-slate-500">Estado</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[entry.status]}`}>{entryStatusLabels[entry.status]}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Referencia</p><p className="mt-2 text-lg font-semibold">{entry.reference || "-"}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Total debito</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(entry.totalDebit))}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Total credito</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(entry.totalCredit))}</p></div>
      </section>

      <section>
        <DataTable columns={columns} rows={entry.lines} minWidth="900px" emptyTitle="Sin lineas" />
      </section>
    </div>
  );
}
