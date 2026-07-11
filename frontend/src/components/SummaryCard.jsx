import { motion, useReducedMotion } from "framer-motion";
import AnimatedNumber from "./animations/AnimatedNumber";
import Card from "./Card";

export default function SummaryCard({ title, value, helper, icon: Icon, tone = "accent", trend }) {
  const reduceMotion = useReducedMotion();
  const numericValue = typeof value === "number" ? value : null;
  const tones = {
    accent: {
      icon: "bg-olive-500/10 text-olive-700 ring-olive-500/20 dark:bg-olive-500/20 dark:text-olive-500 dark:ring-olive-500/30",
      glow: "from-olive-500/10"
    },
    blue: {
      icon: "bg-warm-200 text-warm-700 ring-warm-500/30 dark:bg-warm-800 dark:text-warm-200 dark:ring-warm-700",
      glow: "from-warm-600/10"
    },
    green: {
      icon: "bg-emerald-50 text-olive-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60",
      glow: "from-olive-500/10"
    },
    amber: {
      icon: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60",
      glow: "from-amber-500/10"
    },
    red: {
      icon: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/60",
      glow: "from-red-500/10"
    },
    violet: {
      icon: "bg-terracotta-300/20 text-terracotta-500 ring-terracotta-300/30 dark:bg-terracotta-500/20 dark:text-terracotta-300 dark:ring-terracotta-300/30",
      glow: "from-terracotta-500/10"
    }
  };
  const toneClasses = tones[tone] || tones.accent;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <Card padding="none" className="group relative overflow-hidden p-5" interactive>
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClasses.glow} to-transparent`} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warm-700 dark:text-warm-600">{title}</p>
            <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-ink dark:text-warm-100">
              {numericValue !== null ? <AnimatedNumber value={numericValue} formatter={(next) => Math.round(next)} /> : value}
            </p>
            {helper && <p className="mt-2 text-sm text-warm-700 dark:text-warm-600">{helper}</p>}
            {trend && <p className="mt-3 inline-flex rounded-full bg-warm-200 px-2.5 py-1 text-xs font-semibold text-warm-700 dark:bg-warm-800 dark:text-warm-300">{trend}</p>}
          </div>
          {Icon && (
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1 ${toneClasses.icon}`}>
              <Icon size={21} />
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
