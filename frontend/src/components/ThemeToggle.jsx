import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`grid h-10 w-10 place-items-center rounded-xl border border-warm-400 bg-warm-50 text-warm-700 shadow-sm transition-colors duration-200 hover:bg-warm-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-olive-500/25 dark:border-warm-800 dark:bg-warm-900 dark:text-warm-200 dark:hover:bg-warm-800 ${className}`}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
