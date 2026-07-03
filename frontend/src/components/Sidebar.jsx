import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  Lock,
  NotebookTabs,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  WalletCards
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Dashboard", path: "/", icon: BarChart3 },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Productos", path: "/productos", icon: Package },
  { label: "Inventario", path: "/inventario", icon: Boxes },
  { label: "Proveedores", path: "/suppliers", icon: Truck },
  { label: "Compras", path: "/purchases", icon: ShoppingCart },
  { label: "Facturacion", path: "/invoices", icon: Receipt },
  { label: "Cuentas por Cobrar", path: "/accounts-receivable", icon: CreditCard },
  { label: "Cuentas por Pagar", path: "/accounts-payable", icon: HandCoins },
  { label: "Banco", path: "/banco", icon: Landmark },
  { label: "Caja Chica", path: "/caja-chica", icon: WalletCards },
  { label: "Gastos", path: "/gastos", icon: NotebookTabs },
  { label: "Contabilidad", path: "/contabilidad", icon: Calculator },
  { label: "Finanzas", path: "/finanzas", icon: BriefcaseBusiness },
  { label: "Impuestos", path: "/impuestos", icon: FileText },
  { label: "Recursos Humanos", path: "/recursos-humanos", icon: Building2 },
  { label: "Seguridad", path: "/seguridad", icon: ShieldCheck }
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-lg font-bold">EA</div>
          <div>
            <p className="text-sm uppercase tracking-wide text-white/60">ERP</p>
            <p className="font-semibold">Administrativo</p>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">Panel seguro</p>
              <p className="text-xs text-white/55">Gestion interna</p>
            </div>
          </div>
        </div>

        <nav className="table-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  isActive ? "bg-accent text-white" : "text-white/72 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
