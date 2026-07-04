import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-rose-50 text-rose-600"><ShieldAlert size={28} /></div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-rose-600">Acceso denegado</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">No tienes permiso para ver esta pantalla</h1>
      <p className="mt-2 text-slate-500">Solicita acceso a un administrador si necesitas entrar a este modulo.</p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 font-semibold text-white">Volver al dashboard</Link>
    </div>
  );
}
