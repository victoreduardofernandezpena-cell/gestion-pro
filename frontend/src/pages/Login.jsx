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
      <span className="mb-1.5 block text-sm font-semibold text-warm-700 dark:text-warm-200">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-600" />
        <input
          {...props}
          className={`h-12 w-full rounded-xl border border-warm-500 bg-warm-50 pl-10 pr-3 text-ink outline-none transition focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 dark:border-warm-800 dark:bg-warm-950 dark:text-warm-100 dark:focus:ring-terracotta-300/20 ${props.className || ""}`}
        />
      </div>
      {helper && <p className="mt-1.5 text-xs leading-relaxed text-warm-700 dark:text-warm-600">{helper}</p>}
    </label>
  );
}

export default function Login() {
  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const canRegister = import.meta.env.VITE_DISABLE_PUBLIC_REGISTER !== "true";
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={user?.mustChangePassword ? "/cambiar-contrasena-obligatorio" : "/"} replace />;

  const changeMode = (nextMode) => {
    if (nextMode === "register" && !canRegister) return;
    setMode(nextMode);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register" && !canRegister) {
        throw new Error("El registro publico esta desactivado");
      }
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
    <div className="min-h-screen bg-warm-200 text-ink transition-colors duration-200 dark:bg-warm-950 dark:text-warm-100">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-[linear-gradient(160deg,#3f5f46_0%,#5f7c63_48%,#c46a4a_130%)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-warm-50 text-lg font-bold text-olive-700 shadow-lg shadow-black/10">GP</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Gestion Pro</p>
              <p className="font-semibold">ERP multiempresa</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-warm-100">
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
              <div key={itemTitle} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <p className="font-semibold text-white">{itemTitle}</p>
                <p className="mt-1 text-white/55">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <form onSubmit={handleSubmit} className="w-full max-w-[460px] rounded-2xl border border-warm-400 bg-warm-50 p-7 shadow-warm dark:border-warm-800 dark:bg-warm-900 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-olive-500/10 text-olive-700 dark:bg-olive-500/20 dark:text-olive-500">
                <ShieldCheck size={22} />
              </div>
              <p className="text-sm font-semibold text-accent">Acceso seguro</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal text-ink dark:text-warm-100">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-warm-700 dark:text-warm-600">{subtitle}</p>
            </div>

            <div className={`mb-5 grid ${canRegister ? "grid-cols-2" : "grid-cols-1"} rounded-xl bg-warm-200 p-1 text-sm font-semibold dark:bg-warm-950`}>
              <button type="button" onClick={() => changeMode("login")} className={`h-10 rounded-lg transition ${mode === "login" ? "bg-warm-50 text-ink shadow-sm dark:bg-warm-900 dark:text-warm-100" : "text-warm-700 hover:text-ink dark:hover:text-warm-100"}`}>Entrar</button>
              {canRegister && <button type="button" onClick={() => changeMode("register")} className={`h-10 rounded-lg transition ${mode === "register" ? "bg-warm-50 text-ink shadow-sm dark:bg-warm-900 dark:text-warm-100" : "text-warm-700 hover:text-ink dark:hover:text-warm-100"}`}>Registrarse</button>}
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
                <span className="mb-1.5 block text-sm font-semibold text-warm-700 dark:text-warm-200">Contrasena</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-600" />
                  <input
                    className="h-12 w-full rounded-xl border border-warm-500 bg-warm-50 pl-10 pr-12 text-ink outline-none transition focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 dark:border-warm-800 dark:bg-warm-950 dark:text-warm-100 dark:focus:ring-terracotta-300/20"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-600 hover:text-ink dark:hover:text-warm-100" aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {mode === "register" && <p className="mt-1.5 text-xs leading-relaxed text-warm-700 dark:text-warm-600">Minimo 8 caracteres, con letras y numeros.</p>}
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

            <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-olive-500 px-4 font-semibold text-white transition hover:bg-olive-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-warm-700 dark:text-warm-600">
              {mode === "login" ? (canRegister ? "Si aun no tienes empresa registrada, usa la pestana Registrarse." : "Solicita acceso al administrador de tu empresa.") : "Al crear la cuenta, quedaras como administrador de esa empresa."}
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
