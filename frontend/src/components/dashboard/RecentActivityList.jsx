import { motion, useReducedMotion } from "framer-motion";
import { formatDate, money } from "../../utils/format";
import { staggerContainer, fadeInUp } from "../../utils/motionVariants";
import Card from "../Card";
import SectionHeader from "../SectionHeader";

export default function RecentActivityList({ title, items = [], getTitle, getMeta, getAmount }) {
  const reduceMotion = useReducedMotion();
  return (
    <Card>
      <SectionHeader title={title} description="Ultimos movimientos registrados" />
      <motion.div initial={reduceMotion ? false : "hidden"} animate="show" variants={staggerContainer} className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">Sin actividad reciente.</p>
        ) : (
          items.map((item) => (
            <motion.div key={item.id} variants={fadeInUp} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-950/30 dark:hover:bg-slate-800/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{getTitle(item)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{getMeta ? getMeta(item) : formatDate(item.createdAt)}</p>
              </div>
              {getAmount && <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-300">{money.format(Number(getAmount(item)))}</span>}
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}
