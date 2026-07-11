import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import PageLoader from "../components/PageLoader";
import MainLayout from "../layouts/MainLayout";

const Accounting = lazy(() => import("../pages/Accounting"));
const AccountingAccounts = lazy(() => import("../pages/AccountingAccounts"));
const AccountingEntries = lazy(() => import("../pages/AccountingEntries"));
const AccountingEntryDetail = lazy(() => import("../pages/AccountingEntryDetail"));
const AccountingReports = lazy(() => import("../pages/AccountingReports"));
const Clients = lazy(() => import("../pages/Clients"));
const AccountsReceivable = lazy(() => import("../pages/AccountsReceivable"));
const AccountsPayable = lazy(() => import("../pages/AccountsPayable"));
const AuditLogs = lazy(() => import("../pages/AuditLogs"));
const CreateInvoice = lazy(() => import("../pages/CreateInvoice"));
const CreateAccountingEntry = lazy(() => import("../pages/CreateAccountingEntry"));
const CreatePurchase = lazy(() => import("../pages/CreatePurchase"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Bank = lazy(() => import("../pages/Bank"));
const BankAccountDetail = lazy(() => import("../pages/BankAccountDetail"));
const Brands = lazy(() => import("../pages/Brands"));
const CashBox = lazy(() => import("../pages/CashBox"));
const CashBoxDetail = lazy(() => import("../pages/CashBoxDetail"));
const Expenses = lazy(() => import("../pages/Expenses"));
const Finances = lazy(() => import("../pages/Finances"));
const ForcedPasswordChange = lazy(() => import("../pages/ForcedPasswordChange"));
const HumanResources = lazy(() => import("../pages/HumanResources"));
const Attendance = lazy(() => import("../pages/hr/Attendance"));
const CreatePayroll = lazy(() => import("../pages/hr/CreatePayroll"));
const Departments = lazy(() => import("../pages/hr/Departments"));
const EmployeeDetail = lazy(() => import("../pages/hr/EmployeeDetail"));
const EmployeePayments = lazy(() => import("../pages/hr/EmployeePayments"));
const Employees = lazy(() => import("../pages/hr/Employees"));
const HRReports = lazy(() => import("../pages/hr/HRReports"));
const Payroll = lazy(() => import("../pages/hr/Payroll"));
const PayrollDetail = lazy(() => import("../pages/hr/PayrollDetail"));
const Positions = lazy(() => import("../pages/hr/Positions"));
const Inventory = lazy(() => import("../pages/Inventory"));
const InvoiceDetail = lazy(() => import("../pages/InvoiceDetail"));
const Invoices = lazy(() => import("../pages/Invoices"));
const Login = lazy(() => import("../pages/Login"));
const Loyalty = lazy(() => import("../pages/Loyalty"));
const LoyaltyAccountDetail = lazy(() => import("../pages/loyalty/LoyaltyAccountDetail"));
const LoyaltyClients = lazy(() => import("../pages/loyalty/LoyaltyClients"));
const LoyaltySettings = lazy(() => import("../pages/loyalty/LoyaltySettings"));
const LoyaltyTransactions = lazy(() => import("../pages/loyalty/LoyaltyTransactions"));
const ModuleInDevelopment = lazy(() => import("../pages/ModuleInDevelopment"));
const Products = lazy(() => import("../pages/Products"));
const Profile = lazy(() => import("../pages/Profile"));
const PurchaseDetail = lazy(() => import("../pages/PurchaseDetail"));
const Purchases = lazy(() => import("../pages/Purchases"));
const Reports = lazy(() => import("../pages/Reports"));
const Backups = lazy(() => import("../pages/system/Backups"));
const SystemStatus = lazy(() => import("../pages/system/SystemStatus"));
const AccountsPayableReport = lazy(() => import("../pages/reports/AccountsPayableReport"));
const AccountsReceivableReport = lazy(() => import("../pages/reports/AccountsReceivableReport"));
const AccountingReport = lazy(() => import("../pages/reports/AccountingReport"));
const BankReport = lazy(() => import("../pages/reports/BankReport"));
const CashBoxReport = lazy(() => import("../pages/reports/CashBoxReport"));
const ExpensesReport = lazy(() => import("../pages/reports/ExpensesReport"));
const InventoryReport = lazy(() => import("../pages/reports/InventoryReport"));
const PurchasesReport = lazy(() => import("../pages/reports/PurchasesReport"));
const SalesReport = lazy(() => import("../pages/reports/SalesReport"));
const Security = lazy(() => import("../pages/Security"));
const Settings = lazy(() => import("../pages/Settings"));
const ServerError = lazy(() => import("../pages/ServerError"));
const System = lazy(() => import("../pages/System"));
const CategorySettings = lazy(() => import("../pages/settings/CategorySettings"));
const CompanySettings = lazy(() => import("../pages/settings/CompanySettings"));
const DocumentSettings = lazy(() => import("../pages/settings/DocumentSettings"));
const NumberingSettings = lazy(() => import("../pages/settings/NumberingSettings"));
const TaxSettings = lazy(() => import("../pages/settings/TaxSettings"));
const Suppliers = lazy(() => import("../pages/Suppliers"));
const Taxes = lazy(() => import("../pages/Taxes"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const Users = lazy(() => import("../pages/Users"));
const Warehouses = lazy(() => import("../pages/Warehouses"));

const modules = [];

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader message="Cargando modulo..." />}>
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
            <Route path="inventario/almacenes" element={<Warehouses />} />
            <Route path="inventario/marcas" element={<Brands />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
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
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
            <Route path="reportes" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "ventas"]} />}>
            <Route path="fidelizacion" element={<Loyalty />} />
            <Route path="fidelizacion/clientes" element={<LoyaltyClients />} />
            <Route path="fidelizacion/clientes/:id" element={<LoyaltyAccountDetail />} />
            <Route path="fidelizacion/movimientos" element={<LoyaltyTransactions />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="fidelizacion/configuracion" element={<LoyaltySettings />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
            <Route path="reportes/ventas" element={<SalesReport />} />
            <Route path="reportes/cuentas-por-cobrar" element={<AccountsReceivableReport />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
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
          <Route element={<ProtectedRoute roles={["admin", "contabilidad"]} />}>
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
    </Suspense>
  );
}
