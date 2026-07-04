import { Plus, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../components/Button";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import { getClients } from "../../services/clientService";
import { createLoyaltyAccount, getLoyaltyAccounts, regenerateLoyaltyCredential, updateLoyaltyAccountStatus } from "../../services/loyaltyService";
import { getErrorMessage } from "../../utils/errors";
import { money } from "../../utils/format";

export default function LoyaltyClients() {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = async (term = search) => {
    try {
      setLoading(true);
      const [accountData, clientData] = await Promise.all([getLoyaltyAccounts(term), getClients()]);
      setAccounts(accountData);
      setClients(clientData);
      if (!clientId && clientData[0]) setClientId(clientData[0].id);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar cuentas de fidelizacion"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(""); }, []);

  const createAccount = async () => {
    try {
      const account = await createLoyaltyAccount(clientId);
      setMessage(`Cuenta creada: ${account.credentialCode}`);
      toast.success("Cuenta de fidelizacion creada");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo crear la cuenta"));
      setError(getErrorMessage(err, "No se pudo crear la cuenta"));
    }
  };

  const toggleStatus = async (account) => {
    try {
      await updateLoyaltyAccountStatus(account.id, !account.isActive);
      toast.success("Estado actualizado");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cambiar el estado"));
      setError(getErrorMessage(err, "No se pudo cambiar el estado"));
    }
  };

  const regenerate = async (account) => {
    try {
      await regenerateLoyaltyCredential(account.id);
      toast.success("Credencial regenerada");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo regenerar la credencial"));
      setError(getErrorMessage(err, "No se pudo regenerar la credencial"));
    }
  };

  const columns = [
    { key: "client", header: "Cliente", render: (row) => row.client?.name },
    { key: "credentialCode", header: "Credencial", className: "font-semibold" },
    { key: "moneyBalance", header: "Balance", render: (row) => money.format(Number(row.moneyBalance)) },
    { key: "totalEarned", header: "Ganado", render: (row) => money.format(Number(row.totalEarned)) },
    { key: "totalRedeemed", header: "Usado", render: (row) => money.format(Number(row.totalRedeemed)) },
    { key: "isActive", header: "Estado", render: (row) => row.isActive ? "Activa" : "Inactiva" },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link to={`/fidelizacion/clientes/${row.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Ver</Link>
          <Button variant="outline" size="sm" onClick={() => toggleStatus(row)}>{row.isActive ? "Desactivar" : "Activar"}</Button>
          <Button variant="outline" size="sm" icon={RefreshCcw} onClick={() => setConfirmAction({ type: "regenerate", account: row })}>Regenerar</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fidelizacion</p>
        <h1 className="text-3xl font-semibold text-slate-950">Clientes fieles</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {message && <AlertMessage type="success">{message}</AlertMessage>}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Nueva cuenta</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent">
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <Button icon={Plus} onClick={createAccount}>Crear cuenta</Button>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(event.currentTarget.value)} placeholder="Cliente, RNC o credencial" className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-accent" />
          <Button variant="secondary" onClick={() => load(search)}>Buscar</Button>
        </div>
        {loading ? <p className="text-slate-500">Cargando cuentas...</p> : <DataTable columns={columns} rows={accounts} minWidth="980px" emptyTitle="Sin cuentas" />}
      </section>
      <ConfirmDialog
        open={confirmAction?.type === "regenerate"}
        title="Regenerar credencial"
        message={`Se creara una nueva credencial para ${confirmAction?.account?.client?.name}. Los movimientos anteriores se mantienen.`}
        confirmText="Regenerar"
        variant="primary"
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          const account = confirmAction.account;
          setConfirmAction(null);
          await regenerate(account);
        }}
      />
    </div>
  );
}
