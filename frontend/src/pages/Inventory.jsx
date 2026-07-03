import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RotateCcw } from "lucide-react";
import { createInventoryMovement, getInventory, getInventoryMovements } from "../services/inventoryService";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { getErrorMessage } from "../utils/errors";

const emptyMovement = { productId: "", type: "ENTRADA", quantity: 1, reason: "" };
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState(emptyMovement);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inventoryData, movementData] = await Promise.all([getInventory(), getInventoryMovements()]);
      setInventory(inventoryData);
      setMovements(movementData);
      if (!form.productId && inventoryData[0]) setForm((current) => ({ ...current, productId: inventoryData[0].id }));
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar inventario"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createInventoryMovement(form);
      setForm((current) => ({ ...emptyMovement, productId: current.productId }));
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible registrar el movimiento"));
    } finally {
      setSaving(false);
    }
  };

  const typeIcon = {
    ENTRADA: <ArrowDownToLine size={16} />,
    SALIDA: <ArrowUpFromLine size={16} />,
    AJUSTE: <RotateCcw size={16} />
  };

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock" },
    { key: "minimumStock", header: "Minimo" },
    { key: "cost", header: "Costo", render: (product) => money.format(product.cost) },
    {
      key: "status",
      header: "Estado",
      render: (product) => (
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${product.isLowStock ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {product.isLowStock ? "Stock bajo" : "Disponible"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Almacen</p>
        <h1 className="text-3xl font-semibold text-slate-950">Inventario</h1>
      </div>

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold">Registrar movimiento</h2>
          <FormField label="Producto" as="select" value={form.productId} onChange={(value) => setForm({ ...form, productId: value })} required>
            {inventory.map((product) => (
              <option key={product.id} value={product.id}>{product.code} - {product.name}</option>
            ))}
          </FormField>
          <FormField label="Tipo" as="select" value={form.type} onChange={(value) => setForm({ ...form, type: value })}>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </FormField>
          <FormField label={form.type === "AJUSTE" ? "Nuevo stock" : "Cantidad"} type="number" min={0} value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} required />
          <FormField label="Razon" as="textarea" value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} required={form.type === "AJUSTE"} />
          <button disabled={saving || inventory.length === 0} className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Registrando..." : "Registrar"}</button>
        </form>

        {loading ? (
          <div className="rounded-lg bg-white p-6 shadow-soft">Cargando inventario...</div>
        ) : (
          <DataTable columns={columns} rows={inventory} minWidth="780px" emptyTitle="No hay productos en inventario" emptyDescription="Crea productos antes de registrar movimientos." />
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-lg font-semibold">Historial de movimientos</h2>
        {movements.length === 0 ? (
          <EmptyState title="Sin movimientos" description="Los movimientos de inventario apareceran aqui." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-slate-900">{typeIcon[movement.type]} {movement.type}</span>
                  <span className="text-sm text-slate-500">{movement.quantity}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{movement.product?.code} - {movement.product?.name}</p>
                {movement.reason && <p className="mt-1 text-xs text-slate-500">{movement.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
