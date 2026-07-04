import LoadingSpinner from "./LoadingSpinner";

export default function PageLoader({ message = "Cargando informacion..." }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <LoadingSpinner label={message} />
    </div>
  );
}
