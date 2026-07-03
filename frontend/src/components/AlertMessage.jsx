export default function AlertMessage({ children, type = "error" }) {
  if (!children) return null;

  const styles = {
    error: "bg-rose-50 text-rose-700",
    info: "bg-sky-50 text-sky-700",
    success: "bg-emerald-50 text-emerald-700"
  };

  return <div className={`rounded-lg p-4 text-sm ${styles[type]}`}>{children}</div>;
}
