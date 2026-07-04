import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ onMenu }) {
  const { user, company, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden min-w-72 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-slate-500 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400 md:flex">
            <Search size={18} />
            <span className="text-sm">Buscar en el sistema</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {company && (
            <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 md:block" title={company.tradeName || company.name}>
              {company.code}
            </div>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Alertas">
            <Bell size={18} />
          </button>
          <Link to="/perfil" className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:flex" aria-label="Perfil">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
              <UserRound size={17} />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold leading-4 text-slate-900 dark:text-slate-100">{user?.name}</span>
              <span className="block text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</span>
            </span>
          </Link>
          <Button onClick={logout} variant="secondary" className="h-10 w-10 px-0" aria-label="Cerrar sesion"><LogOut size={18} /></Button>
        </div>
      </div>
    </header>
  );
}
