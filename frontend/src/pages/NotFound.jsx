import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-accent/10 text-accent"><SearchX size={28} /></div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">Pagina no encontrada</h1>
      <p className="mt-2 text-slate-500">La ruta que intentas abrir no existe o fue movida.</p>
      <Link to="/" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2 font-semibold text-white">Volver al dashboard</Link>
    </div>
  );
}
