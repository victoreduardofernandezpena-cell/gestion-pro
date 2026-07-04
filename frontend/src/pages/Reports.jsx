import { BarChart3, Boxes, Calculator, CreditCard, HandCoins, Landmark, Receipt, ShoppingCart, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedCard from "../components/animations/AnimatedCard";
import { staggerContainer } from "../utils/motionVariants";

const reports = [
  { title: "Ventas", description: "Facturas, costos y ganancia bruta.", path: "/reportes/ventas", icon: Receipt },
  { title: "Compras", description: "Compras, pagos y balances pendientes.", path: "/reportes/compras", icon: ShoppingCart },
  { title: "Inventario", description: "Stock, valor de inventario y movimientos.", path: "/reportes/inventario", icon: Boxes },
  { title: "Cuentas por Cobrar", description: "Facturas pendientes y parciales.", path: "/reportes/cuentas-por-cobrar", icon: CreditCard },
  { title: "Cuentas por Pagar", description: "Compras pendientes y parciales.", path: "/reportes/cuentas-por-pagar", icon: HandCoins },
  { title: "Gastos", description: "Gastos por categoria, mes y fuente.", path: "/reportes/gastos", icon: BarChart3 },
  { title: "Banco", description: "Cuentas bancarias y movimientos.", path: "/reportes/banco", icon: Landmark },
  { title: "Caja Chica", description: "Cajas y movimientos de efectivo.", path: "/reportes/caja-chica", icon: WalletCards },
  { title: "Contabilidad", description: "Balance, resultados y resumen contable.", path: "/reportes/contabilidad", icon: Calculator }
];

export default function Reports() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Reportes</p>
        <h1 className="text-3xl font-semibold text-slate-950">Reportes</h1>
      </div>
      <motion.section initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(({ title, description, path, icon: Icon }) => (
          <AnimatedCard as={Link} key={path} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-accent">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon size={22} />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <span className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Ver reporte</span>
          </AnimatedCard>
        ))}
      </motion.section>
    </div>
  );
}
