import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ onMenu }) {
  const { user, company, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-warm-400/80 bg-warm-50/80 backdrop-blur-xl transition-colors duration-200 dark:border-warm-800 dark:bg-warm-950/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="grid h-10 w-10 place-items-center rounded-xl border border-warm-500 bg-warm-50 text-warm-700 shadow-sm transition-colors duration-200 hover:bg-warm-100 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 dark:hover:bg-warm-800 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden min-w-72 items-center gap-2 rounded-xl border border-warm-400/80 bg-warm-100/80 px-3 py-2 text-warm-700 shadow-sm transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900/80 dark:text-warm-600 md:flex">
            <Search size={18} />
            <span className="text-sm">Buscar en el sistema</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {company && (
            <div className="hidden rounded-xl border border-warm-400 bg-warm-50 px-3 py-2 text-sm font-semibold text-warm-700 shadow-sm transition-colors duration-200 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 md:block" title={company.tradeName || company.name}>
              {company.code}
            </div>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-warm-400 bg-warm-50 text-warm-700 shadow-sm transition-colors duration-200 hover:bg-warm-100 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 dark:hover:bg-warm-800" aria-label="Alertas">
            <Bell size={18} />
          </button>
          <Link to="/perfil" className="hidden items-center gap-3 rounded-xl border border-warm-400 bg-warm-50 px-3 py-2 text-warm-700 shadow-sm transition-colors duration-200 hover:bg-warm-100 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 dark:hover:bg-warm-800 sm:flex" aria-label="Perfil">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-olive-500/10 text-olive-700 dark:text-olive-500">
              <UserRound size={17} />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold leading-4 text-ink dark:text-warm-100">{user?.name}</span>
              <span className="block text-xs capitalize text-warm-700 dark:text-warm-600">{user?.role}</span>
            </span>
          </Link>
          <Button onClick={logout} variant="secondary" className="h-10 w-10 px-0" aria-label="Cerrar sesion"><LogOut size={18} /></Button>
        </div>
      </div>
    </header>
  );
}
