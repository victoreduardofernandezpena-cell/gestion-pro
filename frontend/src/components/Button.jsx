import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

const variants = {
  primary: "bg-olive-500 text-white shadow-sm shadow-olive-700/10 hover:bg-olive-700 focus-visible:ring-olive-500/30",
  secondary: "bg-terracotta-500 text-white shadow-sm shadow-terracotta-500/10 hover:brightness-95 focus-visible:ring-terracotta-300/40",
  outline: "border border-warm-500 bg-warm-50 text-warm-700 shadow-sm hover:border-olive-500/50 hover:bg-warm-100 focus-visible:ring-warm-500/40 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-100 dark:hover:border-terracotta-300/50 dark:hover:bg-warm-800",
  danger: "border border-red-200 bg-white text-red-700 shadow-sm hover:bg-red-50 focus-visible:ring-red-200 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50",
  ghost: "text-warm-700 hover:bg-warm-100 focus-visible:ring-warm-400 dark:text-warm-200 dark:hover:bg-warm-800"
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
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
