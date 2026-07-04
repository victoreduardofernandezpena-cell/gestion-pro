import { AlertTriangle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/motionVariants";
import Card from "../Card";
import SectionHeader from "../SectionHeader";

export default function AlertPanel({ title = "Alertas", alerts = [] }) {
  const reduceMotion = useReducedMotion();
  const visible = alerts.filter(Boolean);
  return (
    <Card>
      <SectionHeader title={title} description="Situaciones que requieren atencion operativa" />
      <motion.div initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300">Sin alertas criticas por ahora.</p>
        ) : (
          visible.map((alert, index) => (
            <motion.div key={index} variants={fadeInUp} className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="mt-1 text-amber-800/80 dark:text-amber-200/75">{alert.description}</p>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}
