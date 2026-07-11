import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-dashed border-warm-500 bg-warm-100/70 p-8 text-center text-sm transition-colors duration-200 dark:border-warm-800 dark:bg-warm-950/70">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warm-50 text-olive-500 shadow-sm dark:bg-warm-900 dark:text-terracotta-300">
        <Icon size={22} />
      </div>
      <p className="mt-3 font-semibold text-ink dark:text-warm-100">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-warm-700 dark:text-warm-600">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
