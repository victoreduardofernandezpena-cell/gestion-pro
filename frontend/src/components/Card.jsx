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
        "rounded-2xl border border-warm-400/80 bg-warm-50/95 shadow-soft shadow-stone-900/5 transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900/95 dark:shadow-black/20",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-olive-500/40 hover:shadow-warm dark:hover:border-terracotta-300/40 dark:hover:shadow-black/25",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
