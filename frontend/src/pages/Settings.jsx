import { Building2, FileText, ListTree, Percent, ReceiptText } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import AnimatedCard from "../components/animations/AnimatedCard";
import { staggerContainer } from "../utils/motionVariants";

const cards = [
  { title: "Empresa", description: "Datos fiscales, moneda y contacto.", path: "/configuracion/empresa", icon: Building2 },
  { title: "Impuestos", description: "Tasas, estado y default.", path: "/configuracion/impuestos", icon: Percent },
  { title: "Numeracion", description: "Prefijos y secuencias de documentos.", path: "/configuracion/numeracion", icon: ReceiptText },
  { title: "Categorias", description: "Categorias del sistema.", path: "/configuracion/categorias", icon: ListTree },
  { title: "Documentos", description: "Notas, terminos y pie de pagina.", path: "/configuracion/documentos", icon: FileText }
];

export default function Settings() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Sistema</p><h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Configuracion</h1></div>
      <motion.section initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ title, description, path, icon: Icon }) => (
          <AnimatedCard as={Link} key={path} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 hover:border-accent dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent"><Icon size={22} /></div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            <span className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Entrar</span>
          </AnimatedCard>
        ))}
      </motion.section>
    </div>
  );
}
