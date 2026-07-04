import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, WalletCards } from "lucide-react";
import SummaryCard from "../../components/SummaryCard";
import DataTable from "../../components/DataTable";
import FormField from "../../components/FormField";
import { getProducts } from "../../services/productService";
import { exportReport, getReport } from "../../services/reportService";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, money } from "../../utils/format";
import { FilterShell, LoadingBox, ReportActions, ReportError, ReportHeader } from "./reportUi";

export default function InventoryReport() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ productId: "", lowStock: "", movementType: "", startDate: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [report, productsData] = await Promise.all([getReport("inventory", filters), getProducts()]);
      setData(report);
      setProducts(productsData);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar reporte de inventario"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const download = async (format) => {
    setExporting(true);
    try { await exportReport("inventory", format, filters); } catch (err) { setError(getErrorMessage(err, "No fue posible exportar inventario")); } finally { setExporting(false); }
  };

  const productColumns = [
    { key: "code", header: "Codigo", className: "font-medium" },
    { key: "name", header: "Producto" },
    { key: "stock", header: "Stock" },
    { key: "minimumStock", header: "Minimo" },
    { key: "cost", header: "Costo", render: (row) => money.format(Number(row.cost)) },
    { key: "price", header: "Precio", render: (row) => money.format(Number(row.price)) },
    { key: "stockValue", header: "Valor", render: (row) => money.format(Number(row.stockValue)) }
  ];
  const movementColumns = [
    { key: "createdAt", header: "Fecha", render: (row) => formatDate(row.createdAt) },
    { key: "productCode", header: "Codigo" },
    { key: "productName", header: "Producto" },
    { key: "type", header: "Tipo" },
    { key: "quantity", header: "Cantidad" },
    { key: "reason", header: "Razon" }
  ];

  if (loading) return <LoadingBox>Cargando reporte de inventario...</LoadingBox>;

  return (
    <div className="print-area space-y-6">
      <ReportHeader title="Reporte de Inventario">
        <ReportActions exporting={exporting} onExcel={() => download("excel")} onPdf={() => download("pdf")} onPrint={() => window.print()} />
      </ReportHeader>
      <ReportError>{error}</ReportError>
      <FilterShell onSubmit={(event) => { event.preventDefault(); load(); }}>
        <FormField label="Producto" as="select" value={filters.productId} onChange={(value) => setFilters({ ...filters, productId: value })}>
          <option value="">Todos</option>{products.map((product) => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
        </FormField>
        <FormField label="Stock bajo" as="select" value={filters.lowStock} onChange={(value) => setFilters({ ...filters, lowStock: value })}>
          <option value="">Todos</option><option value="true">Solo stock bajo</option>
        </FormField>
        <FormField label="Movimiento" as="select" value={filters.movementType} onChange={(value) => setFilters({ ...filters, movementType: value })}>
          <option value="">Todos</option><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option><option value="AJUSTE">Ajuste</option>
        </FormField>
        <FormField label="Desde" type="date" value={filters.startDate} onChange={(value) => setFilters({ ...filters, startDate: value })} />
        <FormField label="Hasta" type="date" value={filters.endDate} onChange={(value) => setFilters({ ...filters, endDate: value })} />
      </FilterShell>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Productos" value={data.totalProducts || 0} icon={Boxes} />
        <SummaryCard title="Valor inventario" value={money.format(Number(data.totalStockValue || 0))} icon={WalletCards} tone="green" />
        <SummaryCard title="Stock bajo" value={data.lowStockCount || 0} icon={AlertTriangle} tone="amber" />
      </section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Productos</h2><DataTable columns={productColumns} rows={data.products || []} minWidth="980px" emptyTitle="Sin productos" /></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Movimientos</h2><DataTable columns={movementColumns} rows={data.movements || []} minWidth="900px" emptyTitle="Sin movimientos" /></section>
    </div>
  );
}
