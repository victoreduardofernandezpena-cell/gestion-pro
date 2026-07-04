import { BookOpenCheck, FilePlus2, LibraryBig } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "Catalogo de Cuentas",
    description: "Crear, editar y desactivar cuentas contables.",
    path: "/contabilidad/cuentas",
    icon: LibraryBig
  },
  {
    title: "Asientos Contables",
    description: "Registrar, publicar y cancelar asientos manuales.",
    path: "/contabilidad/asientos",
    icon: FilePlus2
  },
  {
    title: "Reportes Contables",
    description: "Balance de comprobacion, resultados y resumen.",
    path: "/contabilidad/reportes",
    icon: BookOpenCheck
  }
];

export default function Accounting() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Contabilidad</p>
        <h1 className="text-3xl font-semibold text-slate-950">Contabilidad</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map(({ title, description, path, icon: Icon }) => (
          <Link key={path} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-accent">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent">
              <Icon size={22} />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
