import { Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden min-w-72 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 md:flex">
            <Search size={18} />
            <span className="text-sm">Buscar en el sistema</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600" aria-label="Alertas">
            <Bell size={18} />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600" aria-label="Configuracion">
            <Settings size={18} />
          </button>
          <div className="hidden border-l border-slate-200 pl-3 sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs capitalize text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white"
            aria-label="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
