import clsx from "clsx";

export default function PageHeader({ eyebrow, title, description, children, className }) {
  return (
    <div className={clsx("flex flex-col justify-between gap-4 xl:flex-row xl:items-end", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive-700 dark:text-terracotta-300">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink dark:text-warm-100 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-warm-700 dark:text-warm-600 sm:text-base">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
