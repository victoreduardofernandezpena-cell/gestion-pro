import { motion, useReducedMotion } from "framer-motion";
import AnimatedNumber from "./animations/AnimatedNumber";
import Card from "./Card";

export default function SummaryCard({ title, value, helper, icon: Icon, tone = "accent", trend }) {
  const reduceMotion = useReducedMotion();
  const numericValue = typeof value === "number" ? value : null;
  const tones = {
    accent: {
      icon: "bg-teal-50 text-accent ring-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900/60",
      glow: "from-teal-500/10"
    },
    blue: {
      icon: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900/60",
      glow: "from-sky-500/10"
    },
    green: {
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/60",
      glow: "from-emerald-500/10"
    },
    amber: {
      icon: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/60",
      glow: "from-amber-500/10"
    },
    red: {
      icon: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/60",
      glow: "from-rose-500/10"
    },
    violet: {
      icon: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900/60",
      glow: "from-violet-500/10"
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              {numericValue !== null ? <AnimatedNumber value={numericValue} formatter={(next) => Math.round(next)} /> : value}
            </p>
            {helper && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helper}</p>}
            {trend && <p className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{trend}</p>}
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
