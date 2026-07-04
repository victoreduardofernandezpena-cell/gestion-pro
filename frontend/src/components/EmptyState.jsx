import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
        <Icon size={22} />
      </div>
      <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-slate-500 dark:text-slate-400">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-4" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
