import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { createLoyaltyAdjustment, getLoyaltyAccount, regenerateLoyaltyCredential } from "../../services/loyaltyService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money } from "../../utils/format";

export default function LoyaltyAccountDetail() {
  const { id } = useParams();
  const [account, setAccount] = useState(null);
  const [adjustment, setAdjustment] = useState({ amount: "", description: "" });
  const [error, setError] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const load = async () => {
    try {
      setAccount(await getLoyaltyAccount(id));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar la cuenta"));
    }
  };

  useEffect(() => { load(); }, [id]);

  const regenerate = async () => {
    try {
      setAccount(await regenerateLoyaltyCredential(id));
      toast.success("Credencial regenerada");
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo regenerar"));
      setError(getErrorMessage(err, "No se pudo regenerar"));
    }
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();
    try {
      await createLoyaltyAdjustment(id, { amount: Number(adjustment.amount), description: adjustment.description });
      setAdjustment({ amount: "", description: "" });
      toast.success("Ajuste guardado");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo crear el ajuste"));
      setError(getErrorMessage(err, "No se pudo crear el ajuste"));
    }
  };

  if (!account) return <div className="rounded-lg bg-white p-6 shadow-soft">Cargando cuenta...</div>;

  const columns = [
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "type", header: "Tipo", render: (row) => <StatusBadge status={row.type} /> },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "invoice", header: "Factura", render: (row) => row.invoice?.invoiceNumber || "-" },
    { key: "description", header: "Descripcion" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cliente Fiel</p>
          <h1 className="text-3xl font-semibold text-slate-950">{account.client?.name}</h1>
          <p className="mt-1 text-slate-500">{account.credentialCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>Imprimir credencial</Button>
          <Button icon={RefreshCcw} onClick={() => setConfirmRegenerate(true)}>Regenerar</Button>
        </div>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <section className="grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-soft print-area">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cliente Fiel</p>
          <h2 className="mt-3 text-xl font-semibold">{account.client?.name}</h2>
          <div className="my-6 rounded-lg border-2 border-dashed border-slate-300 p-6 text-4xl font-bold tracking-wide">{account.credentialCode}</div>
          <p className="text-sm text-slate-500">Presente o escanee este codigo al comprar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Balance disponible</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(account.moneyBalance))}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Total ganado</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(account.totalEarned))}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Total usado</p><p className="mt-2 text-2xl font-semibold">{money.format(Number(account.totalRedeemed))}</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"><p className="text-sm text-slate-500">Estado</p><p className="mt-2 text-2xl font-semibold">{account.isActive ? "Activa" : "Inactiva"}</p></div>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Ajuste manual</h2>
        <form onSubmit={saveAdjustment} className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
          <input type="number" step="0.01" value={adjustment.amount} onChange={(event) => setAdjustment({ ...adjustment, amount: event.target.value })} placeholder="Monto" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
          <input value={adjustment.description} onChange={(event) => setAdjustment({ ...adjustment, description: event.target.value })} placeholder="Descripcion" className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
          <Button type="submit" variant="secondary">Guardar</Button>
        </form>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Movimientos recientes</h2>
        <DataTable columns={columns} rows={account.transactions || []} minWidth="760px" emptyTitle="Sin movimientos" />
      </section>
      <ConfirmDialog
        open={confirmRegenerate}
        title="Regenerar credencial"
        message="Se creara un nuevo codigo para esta cuenta. El historial y balance se mantienen."
        confirmText="Regenerar"
        variant="primary"
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={async () => {
          setConfirmRegenerate(false);
          await regenerate();
        }}
      />
    </div>
  );
}
