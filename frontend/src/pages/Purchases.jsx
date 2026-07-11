import { useEffect, useState } from "react";
import { Eye, Plus, RotateCcw, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import { getPurchases } from "../services/purchaseService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";
import { DEFAULT_PAGINATION, normalizePaginatedResult } from "../utils/pagination";

const emptyFilters = { text: "", supplier: "", status: "" };

export default function Purchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const load = async (nextFilters = filters, page = pagination.page) => {
    setLoading(true);
    try {
      const result = await getPurchases({ ...nextFilters, page, limit: pagination.limit });
      const normalized = normalizePaginatedResult(result, { ...pagination, page });
      setPurchases(normalized.rows);
      setPagination(normalized.meta);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar compras"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(emptyFilters, 1);
  }, []);

  const columns = [
    { key: "purchaseNumber", header: "Compra", className: "font-medium" },
    { key: "supplier", header: "Proveedor", render: (purchase) => purchase.supplier?.name },
    { key: "createdAt", header: "Fecha", render: (purchase) => formatDate(purchase.createdAt) },
    { key: "total", header: "Total", render: (purchase) => money.format(Number(purchase.total || 0)) },
    { key: "paidAmount", header: "Pagado", render: (purchase) => money.format(Number(purchase.paidAmount || 0)) },
    { key: "balance", header: "Balance", render: (purchase) => money.format(Number(purchase.balance || 0)) },
    {
      key: "status",
      header: "Estado",
      render: (purchase) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[purchase.status]}`}>
          {statusLabels[purchase.status]}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (purchase) => (
        <button onClick={() => navigate(`/purchases/${purchase.id}`)} className="rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="Ver compra">
          <Eye size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Compras</p>
          <h1 className="text-3xl font-semibold text-slate-950">Compras</h1>
        </div>
        <Link to="/purchases/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-semibold text-white">
          <Plus size={18} />
          Nueva Compra
        </Link>
      </div>
      <AlertMessage>{error}</AlertMessage>
      <form onSubmit={(event) => { event.preventDefault(); load(filters, 1); }} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-4">
        <FormField label="Texto" value={filters.text} onChange={(value) => setFilters({ ...filters, text: value })} placeholder="Compra o referencia" />
        <FormField label="Proveedor" value={filters.supplier} onChange={(value) => setFilters({ ...filters, supplier: value })} placeholder="Nombre o RNC" />
        <FormField label="Estado" as="select" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })}>
          <option value="">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="PARTIAL">Parcial</option>
          <option value="PAID">Pagada</option>
          <option value="CANCELLED">Cancelada</option>
        </FormField>
        <div className="flex items-end gap-2">
          <Button type="submit" icon={Search} loading={loading}>Buscar</Button>
          <Button type="button" variant="outline" icon={RotateCcw} onClick={() => { setFilters(emptyFilters); load(emptyFilters, 1); }}>Limpiar</Button>
        </div>
      </form>
      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow-soft">Cargando compras...</div>
      ) : (
        <DataTable columns={columns} rows={purchases} pagination={pagination} onPageChange={(page) => load(filters, page)} minWidth="980px" emptyTitle="No hay compras" emptyDescription="Crea una compra para aumentar inventario y registrar cuentas por pagar." />
      )}
    </div>
  );
}
