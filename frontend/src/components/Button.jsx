import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

const variants = {
  primary: "bg-accent text-white shadow-sm shadow-teal-900/10 hover:brightness-95 focus-visible:ring-accent/30",
  secondary: "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800 focus-visible:ring-slate-400/30 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white",
  outline: "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800",
  danger: "border border-rose-200 bg-white text-rose-700 shadow-sm hover:bg-rose-50 focus-visible:ring-rose-200 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50",
  ghost: "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
};

const sizes = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base"
};

export default function Button({ children, className, variant = "primary", size = "md", loading = false, icon: Icon, disabled, type = "button", ...props }) {
  const reduceMotion = useReducedMotion();
  const MotionButton = reduceMotion ? "button" : motion.button;
  return (
    <MotionButton
      type={type}
      disabled={disabled || loading}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : Icon ? <Icon size={17} /> : null}
      {children}
    </MotionButton>
  );
}
