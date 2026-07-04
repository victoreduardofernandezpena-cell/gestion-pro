import { BadgeDollarSign, CreditCard, ListChecks, Settings } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AnimatedCard from "../components/animations/AnimatedCard";
import SummaryCard from "../components/SummaryCard";
import { getLoyaltySummary } from "../services/loyaltyService";
import { getErrorMessage } from "../utils/errors";
import { money } from "../utils/format";
import { staggerContainer } from "../utils/motionVariants";

const cards = [
  { title: "Clientes fieles", description: "Cuentas, credenciales y balances.", path: "/fidelizacion/clientes", icon: CreditCard },
  { title: "Movimientos", description: "Recompensas, canjes y ajustes.", path: "/fidelizacion/movimientos", icon: ListChecks },
  { title: "Configuracion", description: "Reglas de acumulacion y canje.", path: "/fidelizacion/configuracion", icon: Settings },
  { title: "Buscar credencial", description: "Busca desde crear factura o clientes.", path: "/fidelizacion/clientes", icon: BadgeDollarSign }
];

export default function Loyalty() {
  const reduceMotion = useReducedMotion();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getLoyaltySummary().then(setSummary).catch((err) => setError(getErrorMessage(err, "No se pudo cargar fidelizacion")));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Clientes</p>
        <h1 className="text-3xl font-semibold text-slate-950">Fidelizacion</h1>
      </div>
      <AlertMessage>{error}</AlertMessage>
      {summary && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Clientes fidelizados" value={summary.totalAccounts} helper={`${summary.activeAccounts} activos`} icon={CreditCard} />
          <SummaryCard title="Balance pendiente" value={money.format(summary.pendingBalance)} icon={BadgeDollarSign} tone="amber" />
          <SummaryCard title="Recompensas generadas" value={money.format(summary.totalEarned)} icon={ListChecks} tone="green" />
          <SummaryCard title="Recompensas usadas" value={money.format(summary.totalRedeemed)} icon={BadgeDollarSign} tone="blue" />
        </section>
      )}
      <motion.section initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, description, path, icon: Icon }) => (
          <AnimatedCard as={Link} key={title} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-accent">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent"><Icon size={22} /></div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <span className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Entrar</span>
          </AnimatedCard>
        ))}
      </motion.section>
    </div>
  );
}
