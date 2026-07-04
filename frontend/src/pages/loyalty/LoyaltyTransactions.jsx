import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getLoyaltyTransactions } from "../../services/loyaltyService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money } from "../../utils/format";

export default function LoyaltyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setTransactions(await getLoyaltyTransactions(type ? { type } : {}));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar movimientos"));
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "client", header: "Cliente", render: (row) => row.client?.name },
    { key: "type", header: "Tipo", render: (row) => <StatusBadge status={row.type} /> },
    { key: "amount", header: "Monto", render: (row) => money.format(Number(row.amount)) },
    { key: "points", header: "Puntos/credito", render: (row) => money.format(Number(row.points)) },
    { key: "invoice", header: "Factura", render: (row) => row.invoice?.invoiceNumber || "-" },
    { key: "description", header: "Descripcion" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fidelizacion</p>
        <h1 className="text-3xl font-semibold text-slate-950">Movimientos</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select value={type} onChange={(event) => setType(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent">
          <option value="">Todos</option>
          <option value="EARNED">Ganados</option>
          <option value="REDEEMED">Usados</option>
          <option value="ADJUSTMENT">Ajustes</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        <button onClick={load} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Filtrar</button>
      </div>
      <DataTable columns={columns} rows={transactions} minWidth="980px" emptyTitle="Sin movimientos" />
    </div>
  );
}
