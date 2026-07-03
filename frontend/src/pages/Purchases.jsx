import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import { getPurchases } from "../services/purchaseService";
import { getErrorMessage } from "../utils/errors";
import { formatDate, money, statusClass, statusLabels } from "../utils/format";

export default function Purchases() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPurchases()
      .then(setPurchases)
      .catch((err) => setError(getErrorMessage(err, "No fue posible cargar compras")))
      .finally(() => setLoading(false));
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
      {loading ? (
        <div className="rounded-lg bg-white p-6 shadow-soft">Cargando compras...</div>
      ) : (
        <DataTable columns={columns} rows={purchases} minWidth="980px" emptyTitle="No hay compras" emptyDescription="Crea una compra para aumentar inventario y registrar cuentas por pagar." />
      )}
    </div>
  );
}
