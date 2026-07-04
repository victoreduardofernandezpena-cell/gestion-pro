import { ServerCrash } from "lucide-react";
import { Link } from "react-router-dom";

export default function ServerError() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-rose-50 text-rose-600"><ServerCrash size={28} /></div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-rose-600">Error</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">No se pudo completar la solicitud</h1>
      <p className="mt-2 text-slate-500">El servidor no respondio correctamente. Intenta nuevamente o revisa el backend.</p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 font-semibold text-white">Volver al dashboard</Link>
    </div>
  );
}
