import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Accounting from "../pages/Accounting";
import AccountingAccounts from "../pages/AccountingAccounts";
import AccountingEntries from "../pages/AccountingEntries";
import AccountingEntryDetail from "../pages/AccountingEntryDetail";
import AccountingReports from "../pages/AccountingReports";
import Clients from "../pages/Clients";
import AccountsReceivable from "../pages/AccountsReceivable";
import AccountsPayable from "../pages/AccountsPayable";
import AuditLogs from "../pages/AuditLogs";
import CreateInvoice from "../pages/CreateInvoice";
import CreateAccountingEntry from "../pages/CreateAccountingEntry";
import CreatePurchase from "../pages/CreatePurchase";
import Dashboard from "../pages/Dashboard";
import Bank from "../pages/Bank";
import BankAccountDetail from "../pages/BankAccountDetail";
import CashBox from "../pages/CashBox";
import CashBoxDetail from "../pages/CashBoxDetail";
import Expenses from "../pages/Expenses";
import Finances from "../pages/Finances";
import ForcedPasswordChange from "../pages/ForcedPasswordChange";
import HumanResources from "../pages/HumanResources";
import Attendance from "../pages/hr/Attendance";
import CreatePayroll from "../pages/hr/CreatePayroll";
import Departments from "../pages/hr/Departments";
import EmployeeDetail from "../pages/hr/EmployeeDetail";
import EmployeePayments from "../pages/hr/EmployeePayments";
import Employees from "../pages/hr/Employees";
import HRReports from "../pages/hr/HRReports";
import Payroll from "../pages/hr/Payroll";
import PayrollDetail from "../pages/hr/PayrollDetail";
import Positions from "../pages/hr/Positions";
import Inventory from "../pages/Inventory";
import InvoiceDetail from "../pages/InvoiceDetail";
import Invoices from "../pages/Invoices";
import Login from "../pages/Login";
import Loyalty from "../pages/Loyalty";
import LoyaltyAccountDetail from "../pages/loyalty/LoyaltyAccountDetail";
import LoyaltyClients from "../pages/loyalty/LoyaltyClients";
import LoyaltySettings from "../pages/loyalty/LoyaltySettings";
import LoyaltyTransactions from "../pages/loyalty/LoyaltyTransactions";
import ModuleInDevelopment from "../pages/ModuleInDevelopment";
import Products from "../pages/Products";
import Profile from "../pages/Profile";
import PurchaseDetail from "../pages/PurchaseDetail";
import Purchases from "../pages/Purchases";
import Reports from "../pages/Reports";
import Backups from "../pages/system/Backups";
import SystemStatus from "../pages/system/SystemStatus";
import AccountsPayableReport from "../pages/reports/AccountsPayableReport";
import AccountsReceivableReport from "../pages/reports/AccountsReceivableReport";
import AccountingReport from "../pages/reports/AccountingReport";
import BankReport from "../pages/reports/BankReport";
import CashBoxReport from "../pages/reports/CashBoxReport";
import ExpensesReport from "../pages/reports/ExpensesReport";
import InventoryReport from "../pages/reports/InventoryReport";
import PurchasesReport from "../pages/reports/PurchasesReport";
import SalesReport from "../pages/reports/SalesReport";
import Security from "../pages/Security";
import Settings from "../pages/Settings";
import ServerError from "../pages/ServerError";
import System from "../pages/System";
import CategorySettings from "../pages/settings/CategorySettings";
import CompanySettings from "../pages/settings/CompanySettings";
import DocumentSettings from "../pages/settings/DocumentSettings";
import NumberingSettings from "../pages/settings/NumberingSettings";
import TaxSettings from "../pages/settings/TaxSettings";
import Suppliers from "../pages/Suppliers";
import Taxes from "../pages/Taxes";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import Users from "../pages/Users";

const modules = [];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cambiar-contrasena-obligatorio" element={<ForcedPasswordChange />} />
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="server-error" element={<ServerError />} />
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
            <Route path="finanzas" element={<Finances />} />
            <Route path="impuestos" element={<Taxes />} />
            <Route path="contabilidad" element={<Accounting />} />
            <Route path="contabilidad/cuentas" element={<AccountingAccounts />} />
            <Route path="contabilidad/asientos" element={<AccountingEntries />} />
            <Route path="contabilidad/asientos/nuevo" element={<CreateAccountingEntry />} />
            <Route path="contabilidad/asientos/:id" element={<AccountingEntryDetail />} />
            <Route path="contabilidad/reportes" element={<AccountingReports />} />
            <Route path="banco" element={<Bank />} />
            <Route path="banco/:id" element={<BankAccountDetail />} />
            <Route path="caja-chica" element={<CashBox />} />
            <Route path="caja-chica/:id" element={<CashBoxDetail />} />
            <Route path="gastos" element={<Expenses />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad", "ventas", "almacen"]} />}>
            <Route path="reportes" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "ventas", "contabilidad"]} />}>
            <Route path="fidelizacion" element={<Loyalty />} />
            <Route path="fidelizacion/clientes" element={<LoyaltyClients />} />
            <Route path="fidelizacion/clientes/:id" element={<LoyaltyAccountDetail />} />
            <Route path="fidelizacion/movimientos" element={<LoyaltyTransactions />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="fidelizacion/configuracion" element={<LoyaltySettings />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad", "ventas"]} />}>
            <Route path="reportes/ventas" element={<SalesReport />} />
            <Route path="reportes/cuentas-por-cobrar" element={<AccountsReceivableReport />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad", "almacen"]} />}>
            <Route path="reportes/compras" element={<PurchasesReport />} />
            <Route path="reportes/inventario" element={<InventoryReport />} />
            <Route path="reportes/cuentas-por-pagar" element={<AccountsPayableReport />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
            <Route path="reportes/gastos" element={<ExpensesReport />} />
            <Route path="reportes/banco" element={<BankReport />} />
            <Route path="reportes/caja-chica" element={<CashBoxReport />} />
            <Route path="reportes/contabilidad" element={<AccountingReport />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="seguridad" element={<Security />} />
            <Route path="seguridad/usuarios" element={<Users />} />
            <Route path="seguridad/auditoria" element={<AuditLogs />} />
            <Route path="recursos-humanos" element={<HumanResources />} />
            <Route path="recursos-humanos/empleados" element={<Employees />} />
            <Route path="recursos-humanos/empleados/:id" element={<EmployeeDetail />} />
            <Route path="recursos-humanos/departamentos" element={<Departments />} />
            <Route path="recursos-humanos/puestos" element={<Positions />} />
            <Route path="recursos-humanos/asistencia" element={<Attendance />} />
            <Route path="recursos-humanos/nomina" element={<Payroll />} />
            <Route path="recursos-humanos/nomina/nueva" element={<CreatePayroll />} />
            <Route path="recursos-humanos/nomina/:id" element={<PayrollDetail />} />
            <Route path="recursos-humanos/pagos" element={<EmployeePayments />} />
            <Route path="recursos-humanos/reportes" element={<HRReports />} />
            <Route path="configuracion" element={<Settings />} />
            <Route path="configuracion/empresa" element={<CompanySettings />} />
            <Route path="configuracion/impuestos" element={<TaxSettings />} />
            <Route path="configuracion/numeracion" element={<NumberingSettings />} />
            <Route path="configuracion/categorias" element={<CategorySettings />} />
            <Route path="configuracion/documentos" element={<DocumentSettings />} />
            <Route path="sistema" element={<System />} />
            <Route path="sistema/estado" element={<SystemStatus />} />
            <Route path="sistema/backups" element={<Backups />} />
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
          <Route path="not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
