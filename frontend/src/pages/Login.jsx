import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AlertMessage from "../components/AlertMessage";
import ThemeToggle from "../components/ThemeToggle";
import { getErrorMessage } from "../utils/errors";

const emptyForm = { name: "", email: "", password: "", companyName: "", companyCode: "" };

function LoginField({ icon: Icon, label, helper, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          {...props}
          className={`h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-slate-900 outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-950 ${props.className || ""}`}
        />
      </div>
      {helper && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{helper}</p>}
    </label>
  );
}

export default function Login() {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={user?.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/"} replace />;

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const nextUser = mode === "login" ? await login(form) : await register(form);
      navigate(nextUser.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/");
    } catch (err) {
      setError(getErrorMessage(err, mode === "login" ? "No fue posible iniciar sesion" : "No fue posible crear la cuenta"));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Bienvenido de nuevo" : "Crear espacio de trabajo";
  const subtitle = mode === "login" ? "Entra con tu correo y el codigo de compania." : "Crea tu empresa piloto y entra como administrador.";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-lg font-bold">GP</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Gestion Pro</p>
              <p className="font-semibold">ERP multiempresa</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-teal-100">
              <Sparkles size={15} />
              Piloto web listo para operar
            </div>
            <h1 className="text-5xl font-semibold leading-tight">Ventas, inventario, finanzas y reportes en un solo lugar.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
              Cada empresa entra con su propio codigo. Los datos quedan separados y el administrador controla usuarios, roles y configuracion.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-white/75">
            {[
              ["Acceso por compania", "Un codigo distinto para cada negocio."],
              ["Roles y seguridad", "Administra permisos desde el panel."],
              ["Listo para piloto", "Sin instalar nada en la computadora del cliente."]
            ].map(([itemTitle, description]) => (
              <div key={itemTitle} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="font-semibold text-white">{itemTitle}</p>
                <p className="mt-1 text-white/55">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <form onSubmit={handleSubmit} className="w-full max-w-[460px] rounded-lg border border-slate-200 bg-white p-7 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-accent dark:bg-teal-950">
                <ShieldCheck size={22} />
              </div>
              <p className="text-sm font-semibold text-accent">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold dark:bg-slate-800">
              <button type="button" onClick={() => changeMode("login")} className={`h-10 rounded-md transition ${mode === "login" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>Entrar</button>
              <button type="button" onClick={() => changeMode("register")} className={`h-10 rounded-md transition ${mode === "register" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>Registrarse</button>
            </div>

            <div className="mb-5">
              <AlertMessage>{error}</AlertMessage>
            </div>

            <div className="space-y-4">
              {mode === "register" && (
                <LoginField
                  icon={UserRound}
                  label="Nombre"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  type="text"
                  autoComplete="name"
                  required
                />
              )}

              <LoginField
                icon={Mail}
                label="Email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                type="email"
                autoComplete="email"
                required
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Contrasena</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-12 text-slate-900 outline-none transition focus:border-accent focus:ring-4 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-teal-950"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === "register" && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Minimo 8 caracteres, con letras y numeros.</p>}
              </label>

              {mode === "register" && (
                <LoginField
                  icon={Building2}
                  label="Nombre de empresa"
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                  type="text"
                  autoComplete="organization"
                  required
                />
              )}

              <LoginField
                icon={Building2}
                label="Codigo de compania"
                helper={mode === "login" ? "Ejemplo: EMPRESA1. Debe coincidir con el codigo registrado." : "Este codigo identifica tu empresa. Usa letras y numeros, por ejemplo: REALENGO."}
                value={form.companyCode}
                onChange={(event) => setForm({ ...form, companyCode: event.target.value.toUpperCase() })}
                type="text"
                autoCapitalize="characters"
                autoComplete="organization"
                required
                className="uppercase"
              />
            </div>

            <button disabled={loading} className="mt-6 h-12 w-full rounded-lg bg-accent px-4 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              {mode === "login" ? "Si aun no tienes empresa registrada, usa la pestana Registrarse." : "Al crear la cuenta, quedaras como administrador de esa empresa."}
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
