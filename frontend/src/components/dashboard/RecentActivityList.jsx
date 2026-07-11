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
          <p className="rounded-xl bg-warm-100 p-4 text-sm text-warm-600 dark:bg-warm-950/55 dark:text-warm-400">Sin actividad reciente.</p>
        ) : (
          items.map((item) => (
            <motion.div key={item.id} variants={fadeInUp} className="flex items-start justify-between gap-3 rounded-xl border border-warm-200/80 bg-warm-100/60 p-3 transition-colors hover:border-olive-500/25 hover:bg-white dark:border-warm-800 dark:bg-warm-950/35 dark:hover:bg-warm-800/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-warm-900 dark:text-warm-100">{getTitle(item)}</p>
                <p className="text-xs text-warm-600 dark:text-warm-400">{getMeta ? getMeta(item) : formatDate(item.createdAt)}</p>
              </div>
              {getAmount && <span className="shrink-0 text-sm font-semibold text-warm-800 dark:text-warm-200">{money.format(Number(getAmount(item)))}</span>}
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}
