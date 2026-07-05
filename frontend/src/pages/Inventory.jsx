import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RotateCcw } from "lucide-react";
import { createInventoryMovement, getInventory, getInventoryMovements } from "../services/inventoryService";
import { getWarehouses } from "../services/warehouseService";
import AlertMessage from "../components/AlertMessage";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { getErrorMessage } from "../utils/errors";

const emptyMovement = { productId: "", warehouseId: "", type: "ENTRADA", quantity: 1, cost: "", reference: "", document: "", lotNumber: "", serialNumber: "", expirationDate: "", reason: "" };
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(emptyMovement);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inventoryData, movementData, warehouseData] = await Promise.all([getInventory(), getInventoryMovements(), getWarehouses()]);
      setInventory(inventoryData);
      setMovements(movementData);
      setWarehouses(warehouseData.filter((warehouse) => warehouse.isActive));
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
          <FormField label="Almacen" as="select" value={form.warehouseId} onChange={(value) => setForm({ ...form, warehouseId: value })}>
            <option value="">Principal / sin asignar</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
            ))}
          </FormField>
          <FormField label="Tipo" as="select" value={form.type} onChange={(value) => setForm({ ...form, type: value })}>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </FormField>
          <FormField label={form.type === "AJUSTE" ? "Nuevo stock" : "Cantidad"} type="number" min={0} value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} required />
          <FormField label="Costo" type="number" min={0} value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} />
          <FormField label="Referencia" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
          <FormField label="Documento" value={form.document} onChange={(value) => setForm({ ...form, document: value })} />
          <FormField label="Lote" value={form.lotNumber} onChange={(value) => setForm({ ...form, lotNumber: value })} />
          <FormField label="Serie" value={form.serialNumber} onChange={(value) => setForm({ ...form, serialNumber: value })} />
          <FormField label="Fecha expiracion" type="date" value={form.expirationDate} onChange={(value) => setForm({ ...form, expirationDate: value })} />
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
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Tipo", "Producto", "Almacen", "Entrada", "Salida", "Costo", "Referencia", "Documento", "Lote", "Serie", "Vence", "Nota"].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-t border-slate-100">
                    <td className="px-3 py-2"><span className="flex items-center gap-2">{typeIcon[movement.type]} {movement.type}</span></td>
                    <td className="px-3 py-2">{movement.product?.code} - {movement.product?.name}</td>
                    <td className="px-3 py-2">{movement.warehouse?.name || "-"}</td>
                    <td className="px-3 py-2 text-right">{movement.type === "ENTRADA" ? movement.quantity : ""}</td>
                    <td className="px-3 py-2 text-right">{movement.type === "SALIDA" ? movement.quantity : ""}</td>
                    <td className="px-3 py-2 text-right">{movement.cost ? money.format(Number(movement.cost)) : "-"}</td>
                    <td className="px-3 py-2">{movement.reference || "-"}</td>
                    <td className="px-3 py-2">{movement.document || "-"}</td>
                    <td className="px-3 py-2">{movement.lotNumber || "-"}</td>
                    <td className="px-3 py-2">{movement.serialNumber || "-"}</td>
                    <td className="px-3 py-2">{movement.expirationDate ? new Date(movement.expirationDate).toLocaleDateString("es-DO") : "-"}</td>
                    <td className="px-3 py-2">{movement.note || movement.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
