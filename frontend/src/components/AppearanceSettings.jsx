import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const colorOptions = [
  { value: "teal", label: "Azul verdoso", className: "bg-teal-600" },
  { value: "blue", label: "Azul", className: "bg-blue-600" },
  { value: "green", label: "Verde", className: "bg-emerald-600" },
  { value: "purple", label: "Morado", className: "bg-violet-600" },
  { value: "red", label: "Rojo", className: "bg-red-600" },
  { value: "orange", label: "Naranja", className: "bg-orange-600" }
];

export default function AppearanceSettings() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Apariencia</h2>
      <div className="mt-4 space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tema</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                theme === "light" ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Sun size={16} />
              Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                theme === "dark" ? "border-accent bg-accent text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Moon size={16} />
              Oscuro
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Color principal</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAccentColor(option.value)}
                className={`grid h-9 w-9 place-items-center rounded-full border-2 ${accentColor === option.value ? "border-slate-900 dark:border-white" : "border-transparent"}`}
                aria-label={`Usar color ${option.label}`}
                title={option.label}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-white ${option.className}`}>
                  {accentColor === option.value && <Check size={15} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
