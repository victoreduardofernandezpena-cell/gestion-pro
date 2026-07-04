import { ClipboardList, ShieldCheck, UserCog } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  { title: "Usuarios", description: "Crear, editar, activar y cambiar contrasenas.", path: "/seguridad/usuarios", icon: UserCog },
  { title: "Auditoria", description: "Ver acciones importantes del sistema.", path: "/seguridad/auditoria", icon: ClipboardList },
  { title: "Perfil", description: "Actualizar datos y contrasena propia.", path: "/perfil", icon: ShieldCheck }
];

export default function Security() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Seguridad</p>
        <h1 className="text-3xl font-semibold text-slate-950">Seguridad</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map(({ title, description, path, icon: Icon }) => (
          <Link key={path} to={path} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition hover:border-accent">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-accent/10 text-accent"><Icon size={22} /></div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            <span className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Entrar</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
