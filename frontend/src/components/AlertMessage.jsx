import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function AlertMessage({ children, type = "error" }) {
  const reduceMotion = useReducedMotion();
  if (!children) return null;

  const styles = {
    error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
    info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
  };
  const icons = { error: AlertCircle, info: Info, success: CheckCircle2, warning: TriangleAlert };
  const Icon = icons[type] || AlertCircle;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition-colors duration-200 ${styles[type] || styles.error}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </motion.div>
  );
}
