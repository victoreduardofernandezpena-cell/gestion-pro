import { Activity, Archive, CheckSquare, Info } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedCard from "../components/animations/AnimatedCard";
import { staggerContainer } from "../utils/motionVariants";

const cards = [
  { title: "Estado del sistema", description: "Backend, base de datos y metricas principales.", path: "/sistema/estado", icon: Activity },
  { title: "Backups", description: "Crear, descargar y eliminar respaldos SQL.", path: "/sistema/backups", icon: Archive },
  { title: "Informacion de la aplicacion", description: "Version, entorno y runtime del backend.", path: "/sistema/estado", icon: Info },
  { title: "Checklist de produccion", description: "Revisiones finales antes de desplegar.", path: "/sistema/estado", icon: CheckSquare }
];

export default function System() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Administracion</p>
        <h1 className="text-3xl font-semibold text-slate-950">Sistema</h1>
      </div>
      <motion.section initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, description, path, icon: Icon }) => (
          <AnimatedCard as={Link} key={title} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-accent">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon size={22} />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <span className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Entrar</span>
          </AnimatedCard>
        ))}
      </motion.section>
    </div>
  );
}
