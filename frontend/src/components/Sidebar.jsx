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
  const { user, company, logout } = useAuth();
  const reduceMotion = useReducedMotion();
  const visibleItems = items.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-warm-950/45 backdrop-blur-sm lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-warm-400/80 bg-warm-50/95 text-ink shadow-2xl shadow-stone-900/10 backdrop-blur-xl transition-transform dark:border-warm-800 dark:bg-warm-900/95 dark:text-warm-100 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-warm-400/80 bg-warm-100/70 px-5 dark:border-warm-800 dark:bg-warm-950/40">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-olive-500 text-lg font-bold text-white shadow-lg shadow-olive-700/20">GP</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-700 dark:text-warm-600">ERP</p>
            <p className="font-semibold text-ink dark:text-warm-100">Gestion Pro</p>
          </div>
        </div>

        <div className="border-b border-warm-400/80 px-4 py-4 dark:border-warm-800">
          <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 ring-1 ring-warm-400/80 dark:bg-warm-950/40 dark:ring-warm-800">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-terracotta-300/20 text-terracotta-500">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink dark:text-warm-100">{company?.code || "Panel seguro"}</p>
              <p className="text-xs text-warm-700 dark:text-warm-600">{company?.tradeName || company?.name || "Gestion interna"}</p>
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
                  className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-500/30 ${
                    isActive ? "bg-olive-500/10 text-olive-700 shadow-sm ring-1 ring-olive-500/20 dark:bg-olive-500/20 dark:text-olive-500 dark:ring-olive-500/20" : "text-warm-700 hover:bg-warm-100 hover:text-ink dark:text-warm-300 dark:hover:bg-warm-800 dark:hover:text-warm-100"
                  }`}
                >
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-olive-500" />}
                  <Icon size={19} className={`shrink-0 ${isActive ? "text-olive-700 dark:text-olive-500" : ""}`} />
                  <span className="truncate">{label}</span>
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-warm-400/80 p-4 dark:border-warm-800">
          <div className="mb-3 rounded-2xl bg-warm-100/70 p-3 dark:bg-warm-950/40">
            <p className="truncate text-sm font-semibold text-ink dark:text-warm-100">{user?.name || "Usuario"}</p>
            <p className="text-xs capitalize text-warm-700 dark:text-warm-600">{user?.role || "rol"}</p>
          </div>
          <button type="button" onClick={logout} className="w-full rounded-xl border border-warm-500 bg-warm-50 px-3 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 dark:hover:bg-warm-800">
            Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
