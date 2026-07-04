import clsx from "clsx";

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6"
};

export default function Card({ as: Component = "section", children, className, padding = "md", interactive = false, ...props }) {
  return (
    <Component
      className={clsx(
        "rounded-xl border border-slate-200/80 bg-white/95 shadow-soft shadow-slate-900/5 transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-black/10",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10 dark:hover:border-slate-700 dark:hover:shadow-black/20",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
