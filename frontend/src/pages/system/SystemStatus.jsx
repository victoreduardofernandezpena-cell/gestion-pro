import { Activity, Archive, Boxes, FileText, Receipt, Server, ShoppingCart, Users } from "lucide-react";
import { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import SummaryCard from "../../components/SummaryCard";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/format";
import { getSystemInfo, getSystemStatus } from "../../services/systemService";

const formatUptime = (seconds) => {
  if (!seconds) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statusData, infoData] = await Promise.all([getSystemStatus(), getSystemInfo()]);
        setStatus(statusData);
        setInfo(infoData);
      } catch (err) {
        setError(getErrorMessage(err, "No se pudo cargar el estado del sistema"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Cargando estado del sistema...</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Sistema</p>
        <h1 className="text-3xl font-semibold text-slate-950">Estado del sistema</h1>
      </div>
      {error && <AlertMessage type="error">{error}</AlertMessage>}
      {status && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Backend" value={status.backendStatus} helper={`Activo ${formatUptime(status.uptime)}`} icon={Server} tone="green" />
          <SummaryCard title="Base de datos" value={status.databaseStatus} icon={Activity} tone={status.databaseStatus === "connected" ? "green" : "red"} />
          <SummaryCard title="Usuarios" value={status.totalUsers} icon={Users} tone="blue" />
          <SummaryCard title="Clientes" value={status.totalClients} icon={Users} />
          <SummaryCard title="Productos" value={status.totalProducts} icon={Boxes} tone="amber" />
          <SummaryCard title="Facturas" value={status.totalInvoices} icon={Receipt} tone="blue" />
          <SummaryCard title="Compras" value={status.totalPurchases} icon={ShoppingCart} tone="green" />
          <SummaryCard title="Gastos" value={status.totalExpenses} icon={FileText} tone="red" />
          <SummaryCard title="Ultimo backup" value={status.lastBackup?.filename || "Sin backups"} helper={formatDate(status.lastBackup?.createdAt)} icon={Archive} />
        </section>
      )}
      {info && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-950">Informacion de la aplicacion</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-slate-500">Aplicacion</dt><dd className="font-semibold">{info.appName}</dd></div>
            <div><dt className="text-slate-500">Version</dt><dd className="font-semibold">{info.version}</dd></div>
            <div><dt className="text-slate-500">Entorno</dt><dd className="font-semibold">{info.environment}</dd></div>
            <div><dt className="text-slate-500">Node</dt><dd className="font-semibold">{info.nodeVersion}</dd></div>
            <div><dt className="text-slate-500">Base de datos</dt><dd className="font-semibold">{info.databaseProvider}</dd></div>
            <div><dt className="text-slate-500">Frontend URL</dt><dd className="font-semibold break-all">{info.frontendUrl || "No configurado"}</dd></div>
          </dl>
        </section>
      )}
    </div>
  );
}
