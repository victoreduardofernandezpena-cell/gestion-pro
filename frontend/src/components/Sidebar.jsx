import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  BadgeDollarSign,
  CreditCard,
  FileText,
  HandCoins,
  Landmark,
  Lock,
  NotebookTabs,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  ServerCog,
  Truck,
  Users,
  WalletCards
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const items = [
  { label: "Dashboard", path: "/", icon: BarChart3, roles: ["admin", "ventas", "almacen", "contabilidad"] },
  { label: "Reportes", path: "/reportes", icon: BarChart3, roles: ["admin", "contabilidad"] },
  { label: "Clientes", path: "/clientes", icon: Users, roles: ["admin", "ventas"] },
  { label: "Productos", path: "/productos", icon: Package, roles: ["admin", "ventas", "almacen"] },
  { label: "Inventario", path: "/inventario", icon: Boxes, roles: ["admin", "almacen"] },
  { label: "Almacenes", path: "/inventario/almacenes", icon: Building2, roles: ["admin", "almacen"] },
  { label: "Marcas", path: "/inventario/marcas", icon: NotebookTabs, roles: ["admin", "almacen"] },
  { label: "Proveedores", path: "/suppliers", icon: Truck, roles: ["admin", "contabilidad"] },
  { label: "Compras", path: "/purchases", icon: ShoppingCart, roles: ["admin", "contabilidad"] },
  { label: "Facturacion", path: "/invoices", icon: Receipt, roles: ["admin", "ventas", "contabilidad"] },
  { label: "Cuentas por Cobrar", path: "/accounts-receivable", icon: CreditCard, roles: ["admin", "ventas", "contabilidad"] },
  { label: "Cuentas por Pagar", path: "/accounts-payable", icon: HandCoins, roles: ["admin", "contabilidad"] },
  { label: "Banco", path: "/banco", icon: Landmark, roles: ["admin", "contabilidad"] },
  { label: "Caja Chica", path: "/caja-chica", icon: WalletCards, roles: ["admin", "contabilidad"] },
  { label: "Gastos", path: "/gastos", icon: NotebookTabs, roles: ["admin", "contabilidad"] },
  { label: "Contabilidad", path: "/contabilidad", icon: Calculator, roles: ["admin", "contabilidad"] },
  { label: "Fidelizacion", path: "/fidelizacion", icon: BadgeDollarSign, roles: ["admin", "ventas"] },
  { label: "Finanzas", path: "/finanzas", icon: BriefcaseBusiness, roles: ["admin", "contabilidad"] },
  { label: "Impuestos", path: "/impuestos", icon: FileText, roles: ["admin", "contabilidad"] },
  { label: "Recursos Humanos", path: "/recursos-humanos", icon: Building2, roles: ["admin"] },
  { label: "Seguridad", path: "/seguridad", icon: ShieldCheck, roles: ["admin"] },
  { label: "Configuracion", path: "/configuracion", icon: Settings, roles: ["admin"] },
  { label: "Sistema", path: "/sistema", icon: ServerCog, roles: ["admin"] }
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const visibleItems = items.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-bold shadow-lg shadow-teal-950/30">GP</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">ERP</p>
            <p className="font-semibold">Gestion Pro</p>
          </div>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
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
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
            >
              {({ isActive }) => (
                <motion.span
                  whileHover={reduceMotion ? undefined : { x: 2 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    isActive ? "bg-white text-slate-950 shadow-lg shadow-black/15" : "text-white/68 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />}
                  <Icon size={19} className={`shrink-0 ${isActive ? "text-accent" : ""}`} />
                  <span className="truncate">{label}</span>
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
