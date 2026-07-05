import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarClock, PackageCheck, RotateCcw, Search } from "lucide-react";
import { createInventoryMovement, getInventory, getInventoryAlerts, getInventoryMovements } from "../services/inventoryService";
import { getWarehouses } from "../services/warehouseService";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { ActionBar, FormCard, FormGrid, FormPageLayout, FormSection } from "../components/FormLayout";
import { getErrorMessage } from "../utils/errors";

const emptyMovement = { productId: "", warehouseId: "", type: "ENTRADA", quantity: 1, cost: "", reference: "", document: "", lotNumber: "", serialNumber: "", expirationDate: "", reason: "" };
const emptyMovementFilters = { product: "", warehouseId: "", type: "", reference: "", startDate: "", endDate: "" };
const emptyInventoryFilters = { search: "", status: "ALL", tracking: "ALL" };
const money = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [form, setForm] = useState(emptyMovement);
  const [movementFilters, setMovementFilters] = useState(emptyMovementFilters);
  const [inventoryFilters, setInventoryFilters] = useState(emptyInventoryFilters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async (filters = movementFilters) => {
    setLoading(true);
    try {
      const [inventoryData, movementData, warehouseData, alertData] = await Promise.all([getInventory(), getInventoryMovements(filters), getWarehouses(), getInventoryAlerts()]);
      setInventory(inventoryData);
      setMovements(movementData);
      setWarehouses(warehouseData.filter((warehouse) => warehouse.isActive));
      setAlerts(alertData);
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

  const submitMovementFilters = (event) => {
    event.preventDefault();
    load(movementFilters);
  };

  const clearMovementFilters = () => {
    setMovementFilters(emptyMovementFilters);
    load(emptyMovementFilters);
  };

  const typeIcon = {
    ENTRADA: <ArrowDownToLine size={16} />,
    SALIDA: <ArrowUpFromLine size={16} />,
    AJUSTE: <RotateCcw size={16} />
  };

  const filteredInventory = useMemo(() => {
    const query = inventoryFilters.search.trim().toLowerCase();
    return inventory.filter((product) => {
      const matchesSearch = !query || [product.code, product.name, product.sku, product.reference, product.category, product.brand, product.brandRef?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus =
        inventoryFilters.status === "ALL" ||
        (inventoryFilters.status === "LOW" && product.stock > 0 && product.stock <= product.minimumStock) ||
        (inventoryFilters.status === "OUT" && product.stock <= 0) ||
        (inventoryFilters.status === "OK" && product.stock > product.minimumStock);
      const matchesTracking =
        inventoryFilters.tracking === "ALL" ||
        (inventoryFilters.tracking === "LOT" && product.requiresLot) ||
        (inventoryFilters.tracking === "SERIAL" && product.requiresSerial) ||
        (inventoryFilters.tracking === "EXPIRATION" && product.requiresExpiration);
      return matchesSearch && matchesStatus && matchesTracking;
    });
  }, [inventory, inventoryFilters]);

  const inventorySummary = useMemo(() => {
    const totalValue = inventory.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.cost || 0), 0);
    const lowStock = inventory.filter((product) => product.stock > 0 && product.stock <= product.minimumStock).length;
    const outOfStock = inventory.filter((product) => product.stock <= 0).length;
    return { totalProducts: inventory.length, totalValue, lowStock, outOfStock };
  }, [inventory]);

  const columns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "sku", header: "SKU", render: (product) => product.sku || product.reference || "-" },
    { key: "brand", header: "Marca", render: (product) => product.brandRef?.name || product.brand || "-" },
    { key: "stock", header: "Stock" },
    { key: "minimumStock", header: "Minimo" },
    { key: "cost", header: "Costo", render: (product) => money.format(Number(product.cost || 0)) },
    {
      key: "tracking",
      header: "Control",
      render: (product) => {
        const tags = [
          product.requiresLot ? "Lote" : null,
          product.requiresSerial ? "Serie" : null,
          product.requiresExpiration ? "Vence" : null
        ].filter(Boolean);
        return tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>)}
          </div>
        ) : "-";
      }
    },
    {
      key: "status",
      header: "Estado",
      render: (product) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.isLowStock ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
          {product.isLowStock ? "Stock bajo" : "Disponible"}
        </span>
      )
    }
  ];

  return (
    <FormPageLayout
      eyebrow="Almacen"
      title="Inventario"
      subtitle="Controla existencias, registra entradas/salidas y consulta el historial de movimientos del negocio."
    >

      <AlertMessage>{error}</AlertMessage>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InventoryMetric icon={Boxes} label="Productos" value={inventorySummary.totalProducts} />
        <InventoryMetric icon={PackageCheck} label="Valor inventario" value={money.format(inventorySummary.totalValue)} />
        <InventoryMetric icon={AlertTriangle} label="Stock bajo" value={inventorySummary.lowStock} tone={inventorySummary.lowStock > 0 ? "warning" : "success"} />
        <InventoryMetric icon={CalendarClock} label="Por vencer" value={alerts?.summary?.expiringSoon || 0} tone={(alerts?.summary?.expiringSoon || 0) > 0 ? "warning" : "success"} />
      </section>

      <InventoryAlertsPanel alerts={alerts} />

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <FormCard title="Registrar movimiento" description="Usa entrada, salida o ajuste. El sistema bloquea movimientos que dejen stock negativo.">
          <form onSubmit={submit} className="space-y-5">
            <FormSection title="Producto y operacion">
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
            </FormSection>

            <FormSection title="Detalle">
              <FormField label={form.type === "AJUSTE" ? "Nuevo stock" : "Cantidad"} type="number" min={0} value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} required />
              <FormField label="Costo" type="number" min={0} value={form.cost} onChange={(value) => setForm({ ...form, cost: value })} />
              <FormField label="Referencia" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
              <FormField label="Documento" value={form.document} onChange={(value) => setForm({ ...form, document: value })} />
              <FormField label="Lote" value={form.lotNumber} onChange={(value) => setForm({ ...form, lotNumber: value })} />
              <FormField label="Serie" value={form.serialNumber} onChange={(value) => setForm({ ...form, serialNumber: value })} />
              <FormField label="Fecha expiracion" type="date" value={form.expirationDate} onChange={(value) => setForm({ ...form, expirationDate: value })} />
              <FormField label="Razon" as="textarea" value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} required={form.type === "AJUSTE"} />
            </FormSection>

            <ActionBar>
              <Button type="submit" loading={saving} disabled={inventory.length === 0} icon={PackageCheck}>Registrar movimiento</Button>
              <Button type="button" variant="outline" icon={RotateCcw} onClick={() => setForm((current) => ({ ...emptyMovement, productId: current.productId }))}>Limpiar</Button>
            </ActionBar>
          </form>
        </FormCard>

        <FormCard title="Existencias actuales" description="Vista rapida del stock global por producto.">
          <form className="mb-5 space-y-4">
            <FormGrid columns="xl:grid-cols-3">
              <FormField label="Buscar producto" value={inventoryFilters.search} onChange={(value) => setInventoryFilters({ ...inventoryFilters, search: value })} placeholder="Codigo, nombre, SKU, marca" />
              <FormField label="Estado de stock" as="select" value={inventoryFilters.status} onChange={(value) => setInventoryFilters({ ...inventoryFilters, status: value })}>
                <option value="ALL">Todos</option>
                <option value="OK">Disponible</option>
                <option value="LOW">Stock bajo</option>
                <option value="OUT">Sin stock</option>
              </FormField>
              <FormField label="Control especial" as="select" value={inventoryFilters.tracking} onChange={(value) => setInventoryFilters({ ...inventoryFilters, tracking: value })}>
                <option value="ALL">Todos</option>
                <option value="LOT">Requiere lote</option>
                <option value="SERIAL">Requiere serie</option>
                <option value="EXPIRATION">Tiene vencimiento</option>
              </FormField>
            </FormGrid>
            <ActionBar>
              <Button type="button" variant="outline" icon={RotateCcw} onClick={() => setInventoryFilters(emptyInventoryFilters)}>Limpiar filtros</Button>
            </ActionBar>
          </form>
          <DataTable columns={columns} rows={filteredInventory} minWidth="980px" emptyTitle="No hay productos en inventario" emptyDescription="Crea productos o ajusta los filtros." />
        </FormCard>
      </section>

      <FormCard title="Historial de movimientos" description="Consulta movimientos recientes por producto, almacen, tipo, referencia o fecha.">
        <form onSubmit={submitMovementFilters} className="mb-5 space-y-5">
          <FormGrid columns="xl:grid-cols-6">
            <FormField label="Producto" value={movementFilters.product} onChange={(value) => setMovementFilters({ ...movementFilters, product: value })} placeholder="Nombre, codigo, SKU" />
            <FormField label="Almacen" as="select" value={movementFilters.warehouseId} onChange={(value) => setMovementFilters({ ...movementFilters, warehouseId: value })}>
              <option value="">Todos</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
              ))}
            </FormField>
            <FormField label="Tipo" as="select" value={movementFilters.type} onChange={(value) => setMovementFilters({ ...movementFilters, type: value })}>
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="AJUSTE">Ajuste</option>
            </FormField>
            <FormField label="Referencia" value={movementFilters.reference} onChange={(value) => setMovementFilters({ ...movementFilters, reference: value })} />
            <FormField label="Fecha inicio" type="date" value={movementFilters.startDate} onChange={(value) => setMovementFilters({ ...movementFilters, startDate: value })} />
            <FormField label="Fecha fin" type="date" value={movementFilters.endDate} onChange={(value) => setMovementFilters({ ...movementFilters, endDate: value })} />
          </FormGrid>
          <ActionBar>
            <Button type="submit" icon={Search} loading={loading}>Buscar movimientos</Button>
            <Button type="button" variant="outline" icon={RotateCcw} onClick={clearMovementFilters}>Limpiar filtros</Button>
          </ActionBar>
        </form>

        {movements.length === 0 ? (
          <EmptyState title="Sin movimientos" description="Los movimientos de inventario apareceran aqui." />
        ) : (
          <div className="table-scroll overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  {["Tipo", "Producto", "Almacen", "Entrada", "Salida", "Costo", "Referencia", "Documento", "Lote", "Serie", "Vence", "Nota"].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((movement) => (
                  <tr key={movement.id} className="transition hover:bg-teal-50/40 dark:hover:bg-slate-800/60">
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
      </FormCard>
    </FormPageLayout>
  );
}

function InventoryMetric({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-200"
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <Icon size={19} />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function InventoryAlertsPanel({ alerts }) {
  if (!alerts) return null;
  const blocks = [
    { title: "Sin stock", count: alerts.summary?.outOfStock || 0, rows: alerts.outOfStock || [], tone: "rose" },
    { title: "Stock bajo", count: alerts.summary?.lowStock || 0, rows: alerts.lowStock || [], tone: "amber" },
    { title: "Sin costo", count: alerts.summary?.withoutCost || 0, rows: alerts.withoutCost || [], tone: "slate" },
    { title: "Por vencer", count: alerts.summary?.expiringSoon || 0, rows: alerts.expiringSoon || [], tone: "sky", movement: true }
  ].filter((block) => block.count > 0);

  if (blocks.length === 0) {
    return <AlertMessage type="success">Inventario sin alertas criticas en este momento.</AlertMessage>;
  }

  const toneClass = {
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-200",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-200",
    slate: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
    sky: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/35 dark:text-sky-200"
  };

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {blocks.map((block) => (
        <div key={block.title} className={`rounded-2xl border p-4 ${toneClass[block.tone]}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{block.title}</p>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold dark:bg-slate-950/50">{block.count}</span>
          </div>
          <div className="mt-3 space-y-2">
            {block.rows.slice(0, 3).map((row) => (
              <div key={`${block.title}-${row.id}`} className="rounded-xl bg-white/70 p-2 text-xs dark:bg-slate-950/45">
                <p className="font-semibold">{block.movement ? `${row.product?.code || "-"} - ${row.product?.name || "-"}` : `${row.code} - ${row.name}`}</p>
                <p className="opacity-80">
                  {block.movement
                    ? `Vence: ${row.expirationDate ? new Date(row.expirationDate).toLocaleDateString("es-DO") : "-"}`
                    : `Stock: ${row.stock} | Min: ${row.minimumStock}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
