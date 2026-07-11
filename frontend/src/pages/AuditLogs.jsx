import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getAuditLogs } from "../services/auditService";
import { getUsers } from "../services/userService";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/format";
import { normalizePaginatedResult } from "../utils/pagination";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ startDate: "", endDate: "", userId: "", action: "", module: "", page: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const [data, usersData] = await Promise.all([getAuditLogs(nextFilters), getUsers()]);
      const normalizedLogs = normalizePaginatedResult(data, { page: nextFilters.page, limit: nextFilters.limit, total: 0, totalPages: 1 });
      const normalizedUsers = normalizePaginatedResult(usersData, { page: 1, limit: 100, total: 0, totalPages: 1 });
      setLogs(normalizedLogs.rows);
      setMeta(normalizedLogs.meta);
      setUsers(normalizedUsers.rows);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar auditoria"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const columns = [
    { key: "createdAt", header: "Fecha", render: (row) => `${formatDate(row.createdAt)} ${new Date(row.createdAt).toLocaleTimeString("es-DO")}` },
    { key: "user", header: "Usuario", render: (row) => row.user?.email || "-" },
    { key: "action", header: "Accion", className: "font-medium" },
    { key: "module", header: "Modulo" },
    { key: "entity", header: "Entidad", render: (row) => [row.entityType, row.entityId].filter(Boolean).join(" #") },
    { key: "description", header: "Descripcion" },
    { key: "ipAddress", header: "IP" },
    { key: "userAgent", header: "User Agent" }
  ];

  const apply = (event) => {
    event.preventDefault();
    const next = { ...filters, page: 1 };
    setFilters(next);
    load(next);
  };

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Seguridad</p><h1 className="text-3xl font-semibold text-slate-950">Auditoria</h1></div>
      <AlertMessage>{error}</AlertMessage>
      <form onSubmit={apply} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-5">
          <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
          <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
          <FormField label="Usuario" as="select" value={filters.userId} onChange={(value) => setFilters({ ...filters, userId: value })}><option value="">Todos</option>{users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}</FormField>
          <FormField label="Accion" value={filters.action} onChange={(value) => setFilters({ ...filters, action: value })} />
          <FormField label="Modulo" value={filters.module} onChange={(value) => setFilters({ ...filters, module: value })} />
        </div>
        <button className="mt-3 rounded-lg bg-accent px-4 py-2 font-semibold text-white">Filtrar</button>
      </form>
      {loading ? <div className="rounded-lg bg-white p-6 shadow-soft">Cargando auditoria...</div> : <DataTable columns={columns} rows={logs} pagination={meta} onPageChange={(page) => { const next = { ...filters, page }; setFilters(next); load(next); }} minWidth="1280px" emptyTitle="Sin logs" emptyDescription="No hay acciones con los filtros aplicados." />}
    </div>
  );
}
