import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Clients from "../pages/Clients";
import AccountsReceivable from "../pages/AccountsReceivable";
import AccountsPayable from "../pages/AccountsPayable";
import CreateInvoice from "../pages/CreateInvoice";
import CreatePurchase from "../pages/CreatePurchase";
import Dashboard from "../pages/Dashboard";
import Bank from "../pages/Bank";
import BankAccountDetail from "../pages/BankAccountDetail";
import CashBox from "../pages/CashBox";
import CashBoxDetail from "../pages/CashBoxDetail";
import Expenses from "../pages/Expenses";
import Inventory from "../pages/Inventory";
import InvoiceDetail from "../pages/InvoiceDetail";
import Invoices from "../pages/Invoices";
import Login from "../pages/Login";
import ModuleInDevelopment from "../pages/ModuleInDevelopment";
import Products from "../pages/Products";
import PurchaseDetail from "../pages/PurchaseDetail";
import Purchases from "../pages/Purchases";
import Suppliers from "../pages/Suppliers";

const modules = [
  ["contabilidad", "Contabilidad"],
  ["finanzas", "Finanzas"],
  ["impuestos", "Impuestos"],
  ["recursos-humanos", "Recursos Humanos"],
  ["seguridad", "Seguridad"]
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route element={<ProtectedRoute roles={["admin", "ventas"]} />}>
            <Route path="clientes" element={<Clients />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "ventas", "almacen"]} />}>
            <Route path="productos" element={<Products />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "almacen"]} />}>
            <Route path="inventario" element={<Inventory />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "almacen", "contabilidad"]} />}>
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/:id" element={<PurchaseDetail />} />
            <Route path="accounts-payable" element={<AccountsPayable />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
            <Route path="banco" element={<Bank />} />
            <Route path="banco/:id" element={<BankAccountDetail />} />
            <Route path="caja-chica" element={<CashBox />} />
            <Route path="caja-chica/:id" element={<CashBoxDetail />} />
            <Route path="gastos" element={<Expenses />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "almacen"]} />}>
            <Route path="purchases/new" element={<CreatePurchase />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "ventas", "contabilidad"]} />}>
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="accounts-receivable" element={<AccountsReceivable />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "ventas"]} />}>
            <Route path="invoices/new" element={<CreateInvoice />} />
          </Route>
          {modules.map(([path, title]) => (
            <Route key={path} path={path} element={<ModuleInDevelopment title={title} />} />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}
